import { Effect, Layer, Option as O, pipe } from 'effect';
import { Coords, getRandomName, hexasphere } from '@end/shared';
import { Battle, WarState } from '@end/war/core';
import { getOrUndefined, Option } from 'effect/Option';
import { faker } from '@faker-js/faker';
import * as THREE from 'three';
import * as S from '@effect/schema/Schema';
import { isRight } from 'effect/Either';
import { WarService } from './WarService';
import { derived, store, WarStore } from './WarStore';
import { selectTile, tileIdAndCoords } from './WarUtils';
import { Players, ResultSchema, Tile } from './WarSchema';
import { prop, uniqBy } from 'remeda';

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
        owner: '',
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
        state: WarState,
        raised: Record<string, string>,
        tiles: Record<string, Tile>,
        waterColor: string,
        landColor: string,
        players: { id: string; userName: string; color: string }[],
        portal: [Coords?, Coords?],
        turn: number,
        round: number,
        battles: Battle[],
        battleLimit: number,
        availableTroopsToDeploy: number
      ) {
        store.warId = warId;
        this.setWarState(state);
        this.setLandAndWaterColors(waterColor, landColor);
        this.setTiles(raised, tiles);
        this.setPlayers(players);
        store.portal = portal ?? [undefined, undefined];
        this.setCurrentUserTurn(players[turn - 1].id);
        store.battles = battles;
        store.battleLimit = battleLimit;
        this.setAvailableTroopsToDeploy(availableTroopsToDeploy)

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
            // this.setPortal(coords);
            break;
          case 'deploy':
            this.setDeployTo(coords);
            break;
        }

        store.territoryToAttack = O.none();

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

        if (!c) {
          O.match(store.selectedTileId, {
            onNone() {},
            onSome(selected) {
              const [_, coords] = tileIdAndCoords(selected);
              store.deployTo = O.some(coords);
            },
          });
          return;
        }

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
      setAvailableTroopsToDeploy(availableTroopsToDeploy: number) {
        store.availableTroopsToDeploy = availableTroopsToDeploy;
      },
      deployToTerritory(tileId?: string, troopsCount?: number) {
        if ((!tileId && typeof tileId === 'string') || !troopsCount) {
          O.match(store.selectedTileId, {
            onNone() {},
            onSome(selected) {
              const tile = store.tiles.find((t) => t.id === selected);

              if(!tile) {
                return;
              }

              tile.troopCount = tile.troopCount + store.troopsToDeploy;
            },
          });
          return;
        }

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
        const that = this;
        return pipe(
          this.parseWarLogEntry(entry),
          Effect.match({
            onSuccess: (result) => {
              switch (result.type) {
                case 'war-started':
                  // TODO this logic needs fixe
                  store.warId = O.some(result.war.id);
                  // that.setWarState(state);
                  // that.setLandAndWaterColors(waterColor, landColor);
                  const raised = Object.values(result.war.tiles).reduce(
                    (acc, curr) => {
                      acc[curr.id] = curr.name;
                      return acc;
                    },
                    {} as Record<string, string>
                  );
                  const tiles = Object.values(store.tiles).reduce(
                    (acc, curr) => {
                      const { owner, troopCount } = (() => {
                        if (raised[curr.id]) {
                          const tile = result.war.tiles[curr.id];
                          return {
                            owner: tile.owner,
                            troopCount: tile.troopCount ?? 0,
                          };
                        }

                        return { owner: '', troopCount: 0 };
                      })();

                      acc[curr.id] = {
                        ...curr,
                        owner,
                        troopCount,
                      };
                      return acc;
                    },
                    {} as Record<string, Tile>
                  );

                  that.setTiles(raised, tiles);
                  that.setPlayers(result.war.players);
                  // store.portal = portal ?? [undefined, undefined];
                  this.setCurrentUserTurn(
                    result.war.players[result.war.turn - 1].id
                  );
                  // store.battles = [];
                  store.battleLimit = result.war.battleLimit;

                  // TODO populate tiles with owners and troop counts
                  return 'War started event';
                  break;
                case 'battle-started':
                  let battleStartedUpdates = Object.keys(result.troopUpdates);
                  const battleUpdate1 = store.tiles.find(
                    (t) => t.id === battleStartedUpdates[0]
                  );
                  const battleUpdate2 = store.tiles.find(
                    (t) => t.id === battleStartedUpdates[1]
                  );

                  if (battleUpdate1 && battleUpdate2) {
                    battleUpdate1.troopCount =
                      result.troopUpdates[battleStartedUpdates[0]];
                    battleUpdate2.troopCount =
                      result.troopUpdates[battleStartedUpdates[1]];
                  }
                  store.activeBattle = O.some(result.battle.id);

                  store.battles = uniqBy(
                    [...store.battles, result.battle],
                    (b) => b.id
                  );

                  return 'Battle started event';
                  break;
                case 'attack':
                  let [tile1Id, tile2Id] = Object.keys(result.troopUpdates);
                  const tile1 = store.tiles.find((t) => t.id === tile1Id);
                  const tile2 = store.tiles.find((t) => t.id === tile2Id);

                  // debugger;
                  if (tile1 && tile2) {
                    tile1.troopCount = result.troopUpdates[tile1Id];
                    tile2.troopCount = result.troopUpdates[tile2Id];
                    tile1.owner = result.ownerUpdates[tile1Id];
                    tile2.owner = result.ownerUpdates[tile2Id];
                  }

                  return 'Attack event';
                  break;
                case 'player-joined':
                  this.setPlayers(result.players);

                  return 'Player joined event';
                  break;
                case 'deploy':
                  this.deployToTerritory(result.tile, result.troopsCount);
                  this.setAvailableTroopsToDeploy(result.availableTroopsToDeploy);

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
      setActiveBattle: function (battleId?: string): void {
        if (!battleId) {
          store.activeBattle = O.none();
          return;
        }

        const exists = store.battles.find((b) => b.id == battleId);

        if (exists) {
          store.activeBattle = O.some(battleId);
          return;
        }

        store.activeBattle = O.none();
      },
    });
  })
);
