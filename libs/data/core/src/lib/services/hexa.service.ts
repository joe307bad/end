import { proxy } from 'valtio';
import * as THREE from 'three';
import { Context, Effect, Layer, pipe } from 'effect';
import { faker } from '@faker-js/faker';
import { derive } from 'valtio/utils';
import { Tile, buildCameraPath, hexasphere } from '@end/shared';

export const warProxy = proxy<{
  name: string;
  selection: {
    selectedId: string | null;
    cameraPosition: THREE.Vector3 | null;
  };
  colors: {
    land: string;
    water: string;
  };
  tiles: Tile[];
  sort: 'most-troops' | 'least-troops' | 'alphabetical' | string;
  filter: 'all' | 'mine' | 'opponents' | 'bordering' | string;
}>({
  name: '',
  sort: 'alphabetical',
  filter: 'all',
  selection: {
    selectedId: null,
    cameraPosition: null,
  },
  colors: {
    land: faker.color.rgb({ format: 'hex' }),
    water: faker.color.rgb({ format: 'hex' }),
  },
  // @ts-ignore
  tiles: Object.values(hexasphere.tileLookup).map((tile) => {
    const { x, y, z } = tile.centerPoint;
    return {
      id: `${x},${y},${z}`,
      selected: false,
      defending: false,
      name: '',
      troopCount: 0,
      raised: false,
      owner: 0,
    };
  }),
});

function sortedTilesList(
  sort: 'most-troops' | 'least-troops' | 'alphabetical' | string,
  filter: 'all' | 'mine' | 'opponents' | 'bordering' | string
) {
  return [...warProxy.tiles]
    .sort((a, b) => {
      switch (sort) {
        case 'alphabetical':
          return a?.name?.localeCompare(b?.name ?? '') ?? 0;
        case 'least-troops':
          return (a?.troopCount ?? 0) - (b?.troopCount ?? 0);
        case 'most-troops':
          return (b?.troopCount ?? 0) - (a?.troopCount ?? 0);
      }

      return 0;
    })
    .filter((t) => {
      if (!t.raised) {
        return false;
      }

      switch (filter) {
        case 'all':
          return true;
        case 'mine':
          return t.owner === 1;
        case 'opponents':
          return t.owner === 2;
      }

      return true;
    });
}

export const warDerived = derive({
  cameraPath: (get) => {
    const selectedId = get(warProxy.selection).selectedId;
    const cameraPosition = get(warProxy.selection).cameraPosition;
    if (selectedId && cameraPosition) {
      const { x, y, z } = hexasphere.tileLookup[selectedId].centerPoint;
      return buildCameraPath(cameraPosition, new THREE.Vector3(x, y, z));
    }

    return undefined;
  },
  selectedTileIndex: (get) => {
    const selectedId = get(warProxy.selection).selectedId;
    const sort = get(warProxy).sort;
    const filter = get(warProxy).filter;
    return sortedTilesList(sort, filter).findIndex((t) => t.id === selectedId);
  },
  selectedNeighborsOwners: (get) => {
    const selectedId = get(warProxy.selection).selectedId;
    if (!selectedId || !hexasphere) {
      return {};
    }
    const tiles = get(warProxy).tiles;
    const neighbors = hexasphere.tileLookup[selectedId].neighbors;
    return neighbors.reduce((acc: Record<string, number>, tile) => {
      const { x, y, z } = tile.centerPoint;
      const id = `${x},${y},${z}`;
      const t = tiles.find((t) => t.id === id);

      if(!t) {
        return acc;
      }

      if(!t.raised) {
        return acc;
      }

      acc[id] = typeof t.owner !== 'undefined' ? t.owner : 0;
      return acc;
    }, {});
  },
  raisedTiles: (get) => {
    const tiles = get(warProxy).tiles;
    return tiles.filter((t) => t.raised);
  },
});

interface Hexa {
  readonly getProxy: () => typeof warProxy;
  readonly selectTile: (
    id: string,
    cameraPosition: THREE.Vector3
  ) => Tile | undefined;
  readonly getDerived: () => typeof warDerived;
  readonly getColors: () => { water: string; land: string };
  readonly sortedTilesList: typeof sortedTilesList;
}

const HexaService = Context.GenericTag<Hexa>('hexa-service');

const HexaLive = Layer.effect(
  HexaService,
  Effect.gen(function* () {
    return HexaService.of({
      getProxy: () => {
        return warProxy;
      },
      selectTile: (id: string, cameraPosition: THREE.Vector3) => {
        const currentlySelected = warProxy.tiles.find((tile) => tile.selected);

        if (currentlySelected) {
          currentlySelected.selected = false;
        }

        const newSelected = warProxy.tiles.find((tile) => tile.id === id);

        if (newSelected) {
          newSelected.selected = true;
          warProxy.selection.selectedId = newSelected.id;
          warProxy.selection.cameraPosition = cameraPosition;

          const currentlyDefending = warProxy.tiles.filter(
            (tile) => tile.defending
          );

          if (currentlyDefending.length > 0) {
            currentlyDefending.forEach((tile) => {
              tile.defending = false;
            });
          }

          const neighbors = hexasphere.tileLookup[newSelected.id].neighborIds;

          newSelected.raised &&
            neighbors.forEach((neighborTileId) => {
              const neighbor = warProxy.tiles.find(
                (tile) => tile.id === neighborTileId
              );
              if (neighbor) {
                neighbor.defending = true;
              }
            });
        }

        return currentlySelected;
      },
      getDerived: () => warDerived,
      sortedTilesList,
      getColors: () => {
        return {
          land: warProxy.colors.land,
          water: warProxy.colors.water,
        };
      },
    });
  })
);

const HexaPipe = pipe(HexaLive);

export { HexaService, HexaPipe, Hexa };
