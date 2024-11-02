import { proxy } from 'valtio';
import { Context, Effect, Layer, pipe, Option as O } from 'effect';
import * as S from '@effect/schema/Schema';
import { Option } from 'effect/Option';
import * as THREE from 'three';
import { derive } from 'valtio/utils';
import {
  buildCameraPath,
  Coords,
  hexasphere,
  getRandomName,
} from '@end/shared';
import { faker } from '@faker-js/faker';
import { WarState } from '@end/war/core';
import { isRight } from 'effect/Either';
import { AuthService } from './auth.service';

type Tile = {
  id: string;
  selected: boolean;
  defending: boolean;
  raised: boolean;
  name: string;
  troopCount: number;
  owner: number;
};

const AttackSchema = S.Struct({
  type: S.Literal('attack'),
  tile1: S.String,
  tile2: S.String,
  tile1TroopCount: S.Number,
  tile2TroopCount: S.Number,
});

const ObjectSchema = S.Struct({
  x: S.Number,
  y: S.Number,
  z: S.Number,
});

const PortalSetSchema = S.Struct({
  type: S.Literal('portal-entry-set'),
  portal: S.Tuple(ObjectSchema, ObjectSchema),
});

const DeploySchema = S.Struct({
  type: S.Literal('deploy'),
  tile: S.String,
  troopsCount: S.Number,
});

const PlayerJoinedSchema = S.Struct({
  type: S.Literal('player-joined'),
  players: S.Array(S.Tuple(S.String, S.String)),
});

type PlayerJoined = S.Schema.Type<typeof PlayerJoinedSchema>;

type Players = PlayerJoined['players'];

const ResultSchema = S.Union(
  AttackSchema,
  PlayerJoinedSchema,
  DeploySchema,
  PortalSetSchema
);

type Result = S.Schema.Type<typeof ResultSchema>;

interface WarStore {
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
}

interface IWarService {
  begin: (
    warId: Option<string>,
    title: string,
    state: WarState,
    raised: Record<string, string>,
    tiles: Record<string, Tile>,
    waterColor: string,
    landColor: string,
    players: [string, string][],
    portal: [Coords?, Coords?],
    turn: number,
    round: number
  ) => void;
  setPlayers: (players: Players) => void;
  store: WarStore;
  derived: typeof derived;
  tileIdAndCoords: typeof tileIdAndCoords;
  setWarState: (stage: WarState) => void;
  hasPortal: () => boolean;
  setSelectedTileIdOverride: (coords: string | Coords) => void;
  onTileSelection: (
    tile: string | Coords | null,
    cameraPosition?: THREE.Vector3
  ) => Promise<boolean>;
  setFilter: (filter: WarStore['filter']) => void;
  setLandAndWaterColors: (water: string, land: string) => void;
  setName: (name: string) => void;
  setTiles: (
    raisedTiles: Record<string, string>,
    ownedTiles: Record<string, Tile>
  ) => void;
  setSort: (sort: WarStore['sort']) => void;
  setSettingPortalCoords: (
    settingPortalCords: WarStore['settingPortalCoords']
  ) => void;
  onPortalSetWebSocket: (coords: [Coords?, Coords?]) => void;
  setPortal: (coords: string | Coords) => Promise<true>;
  setDeployTo: (coords: string | Coords) => void;
  setTurnAction: (action?: WarStore['turnAction'] | undefined) => void;
  setAvailableTroopsToDeploy: () => void;
  setTroopsToDeploy: (troopsToDeploy: number) => void;
  setTerritoryToAttack: (coords: Coords) => void;
  attackTerritory: () => Effect.Effect<string, string>;
  deployToTerritory: (tileId: string, troopsCount: number) => void;
  initializeMap: () => void;
  parseWarLogEntry: (entry: any) => Effect.Effect<Result, string>;
  handleWarLogEntry: (entry: any) => Effect.Effect<string, string>;
  setCurrentUserTurn: (userId: string) => void;
  setRound: (round: number) => void;
  setUserId: (userId: string) => void;
}

const store = proxy<WarStore>({
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
});

function sortedTilesList(
  tiles: Tile[],
  sort: 'most-troops' | 'least-troops' | 'alphabetical' | string,
  filter: 'all' | 'mine' | 'opponents' | 'bordering' | string
) {
  return [...tiles]
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
    const tiles = get(store).tiles;

    return O.match(selectedId, {
      onNone: () => undefined,
      onSome: (id) =>
        sortedTilesList(tiles, sort, filter).findIndex((t) => t.id === id),
    });
  },
  sortedTiles: (get) => {
    const sort = get(store).sort;
    const filter = get(store).filter;
    const tiles = get(store).tiles;

    return sortedTilesList(tiles, sort, filter);
  },
  selectedNeighborsOwners: (get) => {
    const selectedId = get(store).selectedTileId;
    const tiles = get(store).tiles;

    return O.match(selectedId, {
      onNone: () => ({} as Record<string, number>),
      onSome: (id) => {
        const neighbors = hexasphere.tileLookup[id].neighbors;
        return neighbors.reduce((acc: Record<string, number>, tile) => {
          const [id] = tileIdAndCoords(tile.centerPoint);
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

function tileIdAndCoords(tile: string | Coords | undefined): [string, Coords] {
  if (!tile) {
    return ['', { x: 0, y: 0, z: 0 }];
  }

  if (isCoords(tile)) {
    return [`${tile.x},${tile.y},${tile.z}`, tile];
  } else {
    const [x, y, z] = tile.split(',').map((x) => parseFloat(x));
    return [tile, { x, y, z }];
  }
}

const WarService = Context.GenericTag<IWarService>('war-service');

function isCoords(value: string | Coords): value is Coords {
  return (
    (value as Coords).x !== undefined &&
    (value as Coords).y !== undefined &&
    (value as Coords).z !== undefined
  );
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

export const WarLive = Layer.effect(
  WarService,
  Effect.gen(function* () {
    store.tiles = Object.keys(hexasphere.tileLookup).map((tileId: string) => {
      return {
        id: tileId,
        selected: false,
        defending: false,
        raised: false,
        name: '',
        troopCount: 0,
        owner: 0,
      };
    });
    // const auth = yield* AuthService;

    return WarService.of({
      store,
      derived,
      tileIdAndCoords,
      setWarState(state: WarState) {
        store.state = O.some(state);
      },
      setCurrentUserTurn(userId) {
        store.currentUsersTurn = userId;
      },
      begin(
        warId: Option<string>,
        title: string,
        state: WarState,
        raised: Record<string, string>,
        tiles: Record<string, Tile>,
        waterColor: string,
        landColor: string,
        players: [string, string][],
        portal: [Coords?, Coords?],
        turn: number,
        round: number
      ) {
        store.warId = warId;
        this.setWarState(state);
        this.setLandAndWaterColors(waterColor, landColor);
        this.setTiles(raised, tiles);
        this.setName(title);
        this.setPlayers(players);
        store.portal = portal ?? [undefined, undefined];
        this.setCurrentUserTurn(players[turn - 1][0]);

        // Effect.match(auth.getUserId(), {
        //   onSuccess: (v) => {
        //     this.setUserId(v);
        //   },
        //   onFailure() {},
        // });

        this.setRound(round);
      },
      setUserId(userId) {
        store.userId = userId;
      },
      setRound(round) {
        store.round = round;
      },
      setPlayers(players: Players) {
        store.players = players;
      },
      hasPortal() {
        return (
          typeof store.portal[0] !== 'undefined' &&
          typeof store.portal[1] !== 'undefined'
        );
      },
      initializeMap() {
        this.setName(getRandomName());
        this.setLandAndWaterColors(
          faker.color.rgb({ format: 'hex' }),
          faker.color.rgb({ format: 'hex' })
        );
        store.tiles.forEach((tile) => {
          tile.raised = faker.datatype.boolean(0.5);
          tile.name = getRandomName();
          tile.troopCount = 0;
        });
      },
      setSelectedTileIdOverride(c: string | Coords) {
        const [tileId, coords] = tileIdAndCoords(c);
        store.selectedTileIdOverride = O.some(tileId);
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
      setTiles(raisedTiles, ownedTiles) {
        store.tiles.forEach((tile) => {
          if (raisedTiles[tile.id]) {
            const name = raisedTiles[tile.id];
            const { troopCount, owner } = ownedTiles[tile.id];
            tile.name = name;
            tile.troopCount = troopCount;
            tile.owner = owner;
            tile.raised = true;
          }
        });
      },
      setSort(sort) {
        store.sort = sort;
      },
      setSettingPortalCoords(settingPortalCords) {
        store.settingPortalCoords = settingPortalCords;
      },
      onTileSelection(
        tile: string | Coords | null,
        cameraPosition?: THREE.Vector3
      ) {
        if (!tile || !cameraPosition) {
          store.selectedTileId = O.none();
          store.cameraPosition = O.none();
          return Promise.resolve(false);
        }

        const [tileId, coords] = tileIdAndCoords(tile);

        selectTile(tileId, cameraPosition);

        switch (store.turnAction) {
          case 'portal':
            this.setPortal(coords);
            break;
          case 'deploy':
            this.setDeployTo(coords);
            break;
        }

        return Promise.resolve(store.turnAction === 'portal');
      },
      setPortal(c) {
        const [_, coords] = tileIdAndCoords(c);
        if (store.settingPortalCoords === 'first') {
          store.portal[0] = coords;
        } else {
          store.portal[1] = coords;
        }

        return Promise.resolve(true);
      },
      setDeployTo(c) {
        const [_, coords] = tileIdAndCoords(c);
        store.deployTo = O.some(coords);
      },
      setTurnAction(action: WarStore['turnAction'] | undefined = undefined) {
        if (action) {
          store.turnAction = action;
        } else {
          switch (store.turnAction) {
            case 'portal':
              store.turnAction = 'deploy';
              break;
            case 'deploy':
              store.turnAction = 'attack';
              break;
            case 'attack':
              store.turnAction = 'portal';
              break;
            // case 'reenforce':
            //   setTurnAction('portal');
            // break;
          }
        }
      },
      setAvailableTroopsToDeploy() {
        store.availableTroopsToDeploy =
          store.availableTroopsToDeploy - store.troopsToDeploy;
      },
      deployToTerritory(tileId: string, troopsCount: number) {
        const tile = store.tiles.find((t) => t.id === tileId);

        if (tile) {
          tile.troopCount = troopsCount;
        }

        // O.match(store.deployTo, {
        //   onNone() {},
        //   onSome(v) {
        //     const [value] = tileIdAndCoords(v);
        //     const tile = store.tiles.find((t) => t.id === value);
        //     if (tile) {
        //       tile.troopCount = tile.troopCount + store.troopsToDeploy;
        //     }
        //   },
        // });
      },
      setTroopsToDeploy(numberOfTroops) {
        store.troopsToDeploy = numberOfTroops;
      },
      setTerritoryToAttack(coords) {
        store.territoryToAttack = O.some(coords);
      },
      attackTerritory() {
        const combined = O.flatMap(store.selectedTileId, (value1) =>
          O.map(store.territoryToAttack, (value2) => ({
            selectedTileId: value1,
            territoryToAttackId: tileIdAndCoords(value2)[0],
          }))
        );

        return O.match(combined, {
          onNone: () => Effect.fail('Missing required arguments to attack'),
          onSome: ({ selectedTileId, territoryToAttackId }) => {
            return Effect.succeed('');
          },
        });
      },
      parseWarLogEntry(entry: any) {
        return pipe(
          Effect.try({
            try: () => JSON.parse(entry),
            catch: () => 'Failed to parse war log entry. Invalid json.',
          }),
          Effect.flatMap((parsed) => {
            const valid = S.decodeEither(ResultSchema)(parsed);

            if (isRight(valid)) {
              return Effect.succeed(valid.right);
            }

            return Effect.fail(
              'Failed to parse war log entry. Entry did not match any known schema.'
            );
          })
        );
      },
      onPortalSetWebSocket(coords: [Coords?, Coords?]) {
        store.portal = coords;
      },
      handleWarLogEntry(entry: any) {
        return pipe(
          this.parseWarLogEntry(entry),
          Effect.match({
            onSuccess: (result) => {
              switch (result.type) {
                case 'attack':
                  const tile1 = store.tiles.find((t) => t.id === result.tile1);
                  const tile2 = store.tiles.find((t) => t.id === result.tile2);

                  if (tile1 && tile2) {
                    tile1.troopCount = result.tile1TroopCount;
                    tile2.troopCount = result.tile2TroopCount;
                  }

                  return 'Attack event';
                  break;
                case 'player-joined':
                  this.setPlayers(result.players);

                  return 'Player joined event';
                  break;
                case 'deploy':
                  this.deployToTerritory(result.tile, result.troopsCount);

                  return 'Deploy event';
                  break;
                case 'portal-entry-set':
                  this.onPortalSetWebSocket(result.portal as any);

                  return 'Portal entry set event';
                  break;
              }
            },
            onFailure: (e) => e,
          })
        );
      },
    });
  })
);

const WarLivePipe = pipe(WarLive);

export { WarService, WarLivePipe, IWarService };
