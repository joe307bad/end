import { proxy } from 'valtio';
import * as THREE from 'three';
import { Context, Effect, Layer, pipe } from 'effect';
import { faker } from '@faker-js/faker';
import { buildCameraPath, getRandomName, hexasphere } from '@end/hexasphere';
import { derive } from 'valtio/utils';

type Tile = {
  id: string;
  selected: boolean;
  defending: boolean;
  raised: boolean;
  name: string;
  troopCount: number;
  owner: number;
};

const hexasphereProxy = proxy<{
  selection: {
    selectedId: string | null;
    cameraPosition: THREE.Vector3 | null;
  };
  colors: {
    land: string;
    water: string;
  };
  tiles: Tile[];
}>({
  selection: {
    selectedId: null,
    cameraPosition: null,
  },
  colors: {
    land: faker.color.rgb({ format: 'hex' }),
    water: faker.color.rgb({ format: 'hex' }),
  },
  tiles: Object.keys(hexasphere.tileLookup).map((tileId: string) => {
    const perctRaised = faker.number.float({ min: 0.1, max: 0.9 });
    return {
      id: tileId,
      selected: false,
      defending: false,
      raised: faker.datatype.boolean(perctRaised),
      name: getRandomName(),
      troopCount: 4,
      owner: 0
    };
  }),
});

const derived = derive({
  cameraPath: (get) => {
    const selectedId = get(hexasphereProxy.selection).selectedId;
    const cameraPosition = get(hexasphereProxy.selection).cameraPosition;
    if (selectedId && cameraPosition) {
      const { x, y, z } = hexasphere.tileLookup[selectedId].centerPoint;
      return buildCameraPath(cameraPosition, new THREE.Vector3(x, y, z));
    }

    return undefined;
  },
  selectedTileIndex: (get) => {
    const selectedId = get(hexasphereProxy.selection).selectedId;
    return hexasphereProxy.tiles
      .filter((t) => t.raised)
      .findIndex((t) => t.id === selectedId);
  },
});

interface Hexa {
  readonly getProxy: () => typeof hexasphereProxy;
  readonly selectTile: (
    id: string,
    cameraPosition: THREE.Vector3
  ) => Tile | undefined;
  readonly getDerived: () => typeof derived;
  readonly getColors: () => { water: string; land: string };
}

const HexaService = Context.GenericTag<Hexa>('hexa-service');

const HexaLive = Layer.effect(
  HexaService,
  Effect.gen(function* () {
    return HexaService.of({
      getProxy: () => {
        return hexasphereProxy;
      },
      selectTile: (id: string, cameraPosition: THREE.Vector3) => {
        const currentlySelected = hexasphereProxy.tiles.find(
          (tile) => tile.selected
        );

        if (currentlySelected) {
          currentlySelected.selected = false;
        }

        const newSelected = hexasphereProxy.tiles.find(
          (tile) => tile.id === id
        );

        if (newSelected) {
          newSelected.selected = true;
          hexasphereProxy.selection.selectedId = newSelected.id;
          hexasphereProxy.selection.cameraPosition = cameraPosition;

          const currentlyDefending = hexasphereProxy.tiles.filter(
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
              const neighbor = hexasphereProxy.tiles.find(
                (tile) => tile.id === neighborTileId
              );
              if (neighbor) {
                neighbor.defending = true;
              }
            });
        }

        return currentlySelected;
      },
      getDerived: () => derived,
      getColors: () => {
        return {
          land: hexasphereProxy.colors.land,
          water: hexasphereProxy.colors.water,
        };
      },
    });
  })
);

const HexaPipe = pipe(HexaLive);

export { HexaService, HexaPipe, Hexa };
