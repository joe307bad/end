import { proxy } from 'valtio';
import { Option as O } from 'effect';
import { getOrUndefined, Option } from 'effect/Option';
import { Battle, WarState } from '@end/war/core';
import * as THREE from 'three';
import { buildCameraPath, Coords, hexasphere } from '@end/shared';
import { Players, Tile } from './WarSchema';
import { derive } from 'valtio/utils';
import { sortedTilesList, tileIdAndCoords } from './WarUtils';

export interface WarStore {
  round: number;
  userId: string;
  currentUsersTurn: string;
  warId: Option<string>;
  state: Option<WarState>;
  players: Players;
  active: boolean;
  name: Option<string>;
  selectedTileId: Option<string>;
  selectedTileIdOverride: Option<string>;
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
  territoryToAttack: Option<Coords>;
  battles: Battle[];
  battleLimit: number;
  activeBattle: Option<string>;
}

export const store = proxy<WarStore>({
  round: 0,
  userId: '',
  currentUsersTurn: '',
  warId: O.none(),
  state: O.none(),
  players: [],
  active: true,
  filter: 'all',
  cameraPosition: O.none(),
  landColor: O.none(),
  selectedTileId: O.none(),
  selectedTileIdOverride: O.none(),
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
  territoryToAttack: O.none(),
  battles: [],
  battleLimit: 0,
  activeBattle: O.none(),
});

export const derived = derive({
  isOwner: (get) => {
    const selectedTileId = get(store).selectedTileId;
    const userId = get(store).userId;
    const owner = get(store).tiles.find(
      (t) => t.id === getOrUndefined(selectedTileId)
    )?.owner;

    return owner === userId;
  },
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
    const tiles = get(store).tiles;
    const userId = get(store).userId;

    return O.match(selectedId, {
      onNone: () => undefined,
      onSome: (id) =>
        sortedTilesList(tiles, sort, filter, userId).findIndex((t) => t.id === id),
    });
  },
  sortedTiles: (get) => {
    const sort = get(store).sort;
    const filter = get(store).filter;
    const tiles = get(store).tiles;
    const userId = get(store).userId;

    return sortedTilesList(tiles, sort, filter, userId);
  },
  selectedNeighborsOwners: (get) => {
    const selectedId = get(store).selectedTileId;
    const tiles = get(store).tiles;
    const userId = get(store).userId;

    return O.match(selectedId, {
      onNone: () => ({} as Record<string, number>),
      onSome: (id) => {
        const neighbors = hexasphere.tileLookup[id].neighbors;
        return neighbors.reduce((acc: Record<string, string>, tile) => {
          const [id] = tileIdAndCoords(tile.centerPoint);
          const t = tiles.find((t) => t.id === id);

          if (!t) {
            return acc;
          }

          if(t.owner === userId) {
            return acc;
          }

          if (!t.raised) {
            return acc;
          }

          acc[id] = typeof t.owner !== 'undefined' ? t.owner : '0';
          return acc;
        }, {});
      },
    });
  },
  raisedTiles: (get) => {
    const tiles = get(store).tiles;
    return tiles.filter((t) => t.raised);
  },
  battles: (get) => {
    const b = get(store).battles;
    const limit = get(store).battleLimit;
    return [
      ...b,
      ...Array.from({ length: limit - b.length }).map((_, i) => {
        return { id: `B${i + b.length}` } as Battle;
      }),
    ];
  },
});
