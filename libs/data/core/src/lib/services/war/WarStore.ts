import { proxy } from 'valtio';
import { Option as O } from 'effect';
import { getOrUndefined, Option } from 'effect/Option';
import { Battle, getDeploymentsByTerritory, WarState } from '@end/war/core';
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
  turnAction: 'portal' | 'deploy' | 'attack' | 'complete';
  availableTroopsToDeploy: number;
  troopsToDeploy: number;
  territoryToAttack: Option<Coords>;
  battles: Battle[];
  battleLimit: number;
  activeBattle: Option<string>;
  deployments: { deployTo: string; troopsToDeploy: number; date: string }[];
}

export const store = proxy<WarStore>({
  round: 0,
  userId: '',
  currentUsersTurn: '',
  warId: O.none(),
  state: O.none(),
  players: [],
  active: true,
  filter: 'mine',
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
  turnAction: 'complete',
  availableTroopsToDeploy: 100,
  troopsToDeploy: 0,
  territoryToAttack: O.none(),
  battles: [],
  battleLimit: 0,
  activeBattle: O.none(),
  deployments: [],
});

export const derived = derive({
  deployments: (get) => {
    const tiles = get(store).tiles;
    const deployments = get(store).deployments;
    return getDeploymentsByTerritory(deployments, tiles);
  },
  portalNames: (get) => {
    const tiles = get(store).tiles;
    const [portal1, portal2] = get(store).portal;

    const [entry] = tileIdAndCoords(portal1);
    const [exit] = tileIdAndCoords(portal2);

    const one = tiles.find((t) => t.id === entry);
    const two = tiles.find((t) => t.id === exit);

    if (!one || !two) {
      return undefined;
    }

    return [[one.name, one.owner], [two.name, two.owner]];
  },
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
        sortedTilesList(tiles, sort, filter, userId).findIndex(
          (t) => t.id === id
        ),
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
    const [portal1, portal2] = get(store).portal;
    const userId = get(store).userId;

    return O.match(selectedId, {
      onNone: () => ({} as Record<string, Tile>),
      onSome: (id) => {
        const neighbors = hexasphere.tileLookup[id].neighbors;

        const neighboringTiles = neighbors.reduce(
          (acc: Record<string, Tile>, tile) => {
            const [id] = tileIdAndCoords(tile?.centerPoint);
            const t = tiles.find((t) => t.id === id);

            if (!t) {
              return acc;
            }

            if (t.owner === userId) {
              return acc;
            }

            if (!t.raised) {
              return acc;
            }

            acc[id] = t;
            return acc;
          },
          {}
        );

        const throughPortal: Tile | undefined = (() => {
          if (!portal1 || !portal2) {
            return undefined;
          }

          const [portal1Id] = tileIdAndCoords(portal1);
          const [portal2Id] = tileIdAndCoords(portal2);

          if (portal1Id === id) {
            return tiles.find((t) => t.id === portal2Id);
          }

          if (portal2Id === id) {
            return tiles.find((t) => t.id === portal1Id);
          }

          return undefined;
        })();

        if (throughPortal && throughPortal.owner !== userId) {
          neighboringTiles[throughPortal.id] = throughPortal;
        }

        return neighboringTiles;
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
  battlesByTile: (get) => {
    const b = get(store).battles;
    return b.reduce((acc, battle) => {
      const aggressor = battle.attackingFromTerritory;
      const defender = battle.defendingTerritory;

      if (acc[aggressor]) {
        acc[aggressor].push(battle);
      } else {
        acc[aggressor] = [battle];
      }

      if (acc[defender]) {
        acc[defender].push(battle);
      } else {
        acc[defender] = [battle];
      }

      return acc;
    }, {} as Record<string, Battle[]>);
  },
  currentTurnAndRound: (get) => {
    const players = get(store).players;
    const currentUsersTurn = get(store).currentUsersTurn;
    const round = get(store).round;

    const turn = players.findIndex((p) => p.id === currentUsersTurn) + 1;
    return `${turn} / ${round}`;
  },
  remainingTroops: (get) => {
    const tiles = get(store).tiles;
    const userId = get(store).userId;
    return tiles.reduce((acc, curr) => {
      if (curr.owner === userId) {
        acc = acc + curr.troopCount;
        return acc;
      }

      return acc;
    }, 0);
  },
});
