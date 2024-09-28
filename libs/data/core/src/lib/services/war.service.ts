import { proxy } from 'valtio';
import { Context, Effect, Layer, pipe, Option as O } from 'effect';
import type { Option } from 'effect/Option';
import * as THREE from 'three';
import {
  buildCameraPath,
  Coords,
  getRandomName,
  hexasphere,
} from '@end/hexasphere';
import { derive } from 'valtio/utils';
import { faker } from '@faker-js/faker';

type Tile = {
  id: string;
  selected: boolean;
  defending: boolean;
  raised: boolean;
  name: string;
  troopCount: number;
  owner: number;
};

interface WarStore {
  active: boolean;
  name: Option<string>;
  selectedTileId: Option<string>;
  cameraPosition: Option<THREE.Vector3>;
  waterColor: Option<string>;
  landColor: Option<string>;
  tiles: Tile[];
  sort: 'most-troops' | 'least-troops' | 'alphabetical';
  filter: 'all' | 'mine' | 'opponents' | 'bordering';
  settingPortalCoords: 'first' | 'second';
  portal: [Coords?, Coords?];
  deployTo: Option<Coords>;
  turnAction: 'portal' | 'deploy' | 'attack';
  availableTroopsToDeploy: number;
  troopsToDeploy: number;
  attacking: Option<Coords>;
}

function sortedTilesList(
  sort: 'most-troops' | 'least-troops' | 'alphabetical' | string,
  filter: 'all' | 'mine' | 'opponents' | 'bordering' | string
) {
  return [...store.tiles]
    .sort((a, b) => {
      switch (sort) {
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'least-troops':
          return a.troopCount - b.troopCount;
        case 'most-troops':
          return b.troopCount - a.troopCount;
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

const store = proxy<WarStore>({
  active: true,
  filter: 'all',
  cameraPosition: O.none(),
  landColor: O.none(),
  selectedTileId: O.none(),
  sort: 'alphabetical',
  tiles: [],
  waterColor: O.none(),
  name: O.none(),
  settingPortalCoords: 'first',
  portal: [undefined, undefined],
  deployTo: O.none(),
  turnAction: 'portal',
  availableTroopsToDeploy: 100,
  troopsToDeploy: 0,
  attacking: O.none(),
});

const derived = derive({
  cameraPath: (get) => {
    const selectedId = get(store).selectedTileId;
    const cameraPosition = get(store).cameraPosition;

    const combined = O.flatMap(selectedId, (value1) =>
      O.map(cameraPosition, (value2) => ({
        selectedId: value1,
        cameraPosition: value2,
      }))
    );

    return O.match(combined, {
      onNone: () => undefined,
      onSome: (values) => {
        const { x, y, z } =
          hexasphere.tileLookup[values.selectedId].centerPoint;
        return buildCameraPath(
          values.cameraPosition,
          new THREE.Vector3(x, y, z)
        );
      },
    });
  },
  selectedTileIndex: (get) => {
    const selectedId = get(store).selectedTileId;
    const sort = get(store).sort;
    const filter = get(store).filter;

    return O.match(selectedId, {
      onNone: () => undefined,
      onSome: (id) =>
        sortedTilesList(sort, filter).findIndex((t) => t.id === id),
    });
  },
  selectedNeighborsOwners: (get) => {
    const selectedId = get(store).selectedTileId;
    const tiles = get(store).tiles;

    return O.match(selectedId, {
      onNone: () => undefined,
      onSome: (id) => {
        const neighbors = hexasphere.tileLookup[id].neighbors;
        return neighbors.reduce((acc: Record<string, number>, tile) => {
          const { x, y, z } = tile.centerPoint;
          const id = `${x},${y},${z}`;
          const t = tiles.find((t) => t.id === id);

          if (!t) {
            return acc;
          }

          if (!t.raised) {
            return acc;
          }

          acc[id] = typeof t.owner !== 'undefined' ? t.owner : 0;
          return acc;
        }, {});
      },
    });
  },
  raisedTiles: (get) => {
    const tiles = get(store).tiles;
    return tiles.filter((t) => t.raised);
  },
});

interface IWarService {
  store: WarStore;
  derived: typeof derived;
  hasPortal: () => boolean;
  onTileSelection: (
    tile: string | Coords,
    cameraPosition: THREE.Vector3
  ) => void;
  setFilter: (filter: WarStore['filter']) => void;
  setLandAndWaterColors: (water: string, land: string) => void;
  setName: (name: string) => void;
  setTiles: (tiles: Tile[]) => void;
  setSort: (sort: WarStore['sort']) => void;
  setSettingPortalCoords: (
    settingPortalCords: WarStore['settingPortalCoords']
  ) => void;
  setPortal: (coords: Coords) => void;
  setDeployTo: (coords: Coords) => void;
  setTurnAction: (action: WarStore['turnAction']) => void;
  setAvailableTroopsToDeploy: (numberOfTroops: number) => void;
  setAttacking: (coords: Coords) => void;
  setCameraPosition: (v3: THREE.Vector3) => void;
}

const WarService = Context.GenericTag<IWarService>('war-service');

function isCoords(value: string | Coords): value is Coords {
  return (
    (value as Coords).x !== undefined &&
    (value as Coords).y !== undefined &&
    (value as Coords).z !== undefined
  );
}

function tileIdAndCoords(tile: string | Coords): [string, Coords] {
  if (isCoords(tile)) {
    return [`${tile.x},${tile.y},${tile.z}`, tile];
  } else {
    const [x, y, z] = tile.split(',').map((x) => parseFloat(x));
    return [tile, { x, y, z }];
  }
}

function selectTile(id: string, cameraPosition: THREE.Vector3) {
  const currentlySelected = store.tiles.find((tile) => tile.selected);
  if (currentlySelected) {
    currentlySelected.selected = false;
  }

  const newSelected = store.tiles.find((tile) => tile.id === id);

  if (newSelected) {
    newSelected.selected = true;
    store.selectedTileId = O.some(newSelected.id);
    store.cameraPosition = O.some(cameraPosition);

    const currentlyDefending = store.tiles.filter((tile) => tile.defending);

    if (currentlyDefending.length > 0) {
      currentlyDefending.forEach((tile) => {
        tile.defending = false;
      });
    }

    const neighbors = hexasphere.tileLookup[newSelected.id].neighborIds;

    newSelected.raised &&
      neighbors.forEach((neighborTileId) => {
        const neighbor = store.tiles.find((tile) => tile.id === neighborTileId);
        if (neighbor) {
          neighbor.defending = true;
        }
      });
  }

  return currentlySelected;
}

const WarLive = Layer.effect(
  WarService,
  Effect.gen(function* () {
    store.tiles = Object.keys(hexasphere.tileLookup).map((tileId: string) => {
      const perctRaised = faker.number.float({ min: 0.1, max: 0.9 });
      return {
        id: tileId,
        selected: false,
        defending: false,
        raised: faker.datatype.boolean(perctRaised),
        name: getRandomName(),
        troopCount: 0,
        owner: 0,
      };
    });

    return WarService.of({
      store,
      derived,
      hasPortal() {
        return (
          typeof store.portal[0] !== 'undefined' &&
          typeof store.portal[1] !== 'undefined'
        );
      },
      setCameraPosition(v3) {
        store.cameraPosition = O.some(v3);
      },
      setFilter(filter) {
        store.filter = filter;
      },
      setLandAndWaterColors(water, land) {
        store.waterColor = O.some(water);
        store.landColor = O.some(land);
      },
      setName(name) {
        store.name = O.some(name);
      },
      setTiles(tiles) {
        store.tiles = tiles;
      },
      setSort(sort) {
        store.sort = sort;
      },
      setSettingPortalCoords(settingPortalCords) {
        store.settingPortalCoords = settingPortalCords;
      },
      onTileSelection(tile: string | Coords, cameraPosition: THREE.Vector3) {
        const [tileId, coords] = tileIdAndCoords(tile);

        console.log({ tileId, coords });

        selectTile(tileId, cameraPosition);

        switch (store.turnAction) {
          case 'portal':
            this.setPortal(coords);
            break;
          case 'deploy':
            this.setDeployTo(coords);
            break;
        }
      },
      setPortal(coords) {
        if (store.settingPortalCoords === 'first') {
          store.portal[0] = coords;
        } else {
          store.portal[1] = coords;
        }
      },
      setDeployTo(coords) {
        store.deployTo = O.some(coords);
      },
      setTurnAction(action) {
        store.turnAction = action;
      },
      setAvailableTroopsToDeploy(numberOfTroops) {
        store.availableTroopsToDeploy = numberOfTroops;
      },
      setAttacking(coords) {
        store.attacking = O.some(coords);
      },
    });
  })
);

const WarPipe = pipe(WarLive);

export { WarService, WarPipe, IWarService };
