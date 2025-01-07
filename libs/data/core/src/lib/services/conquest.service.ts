import { Battle, Tile } from '@end/war/core';
import { Effect, Context, Layer, pipe, Option as O } from 'effect';
import { FetchService } from './fetch.service';
import { Planet, War, WarUser } from '@end/wm/core';
import { DbService } from './db.service';
import { BehaviorSubject } from 'rxjs';
import { io } from 'socket.io-client';
import { ConfigService } from './config.service';
import { hexasphere } from '@end/shared';
import { WarService } from './war.service';
import { getOrUndefined } from 'effect/Option';
import { AuthService } from './auth.service';
import { execute } from '@end/data/core';
import { store } from './war/WarStore';
import { SyncService } from './sync.service';

enum Actions {
  InvalidTurn,
  NewBattle,
  Attack,
}

interface Conquest {
  readonly warLog: BehaviorSubject<string | null>;
  readonly startWar: (
    players: number
  ) => Effect.Effect<{ warId: string, playerId: string }, string>;
  readonly getWar: (warId: string) => Effect.Effect<War, string>;
  readonly connectToWarLog: (
    warId: string,
    callback: (v: string | null) => void
  ) => () => void;
  readonly attack: () => Effect.Effect<Response, string>;
  readonly completeTurn: () => Effect.Effect<Response, string>;
  readonly deploy: () => Effect.Effect<Response, string>;
  readonly setPortal: () => Effect.Effect<Response, string>;
  readonly startBattle: () => Effect.Effect<Response, string>;
  readonly addPlayer: (payload: {
    warId: string;
  }) => Effect.Effect<void, unknown>;
  readonly engage: () => Effect.Effect<Response, string>;
  readonly beginTurnNumber1: () => Effect.Effect<Response, string>;
}

const ConquestService = Context.GenericTag<Conquest>('conquest-api');

export const ConquestLive = Layer.effect(
  ConquestService,
  Effect.gen(function* () {
    const fetch = yield* FetchService;
    const db = yield* DbService;
    const config = yield* ConfigService;
    const war = yield* WarService;
    const database = yield* db.database();
    let warLog = new BehaviorSubject<string | null>(null);

    return ConquestService.of({
      warLog,
      startWar: (players: number) => {
        const raised = war.store.tiles
          .filter((tile) => tile.raised)
          .reduce((acc: Record<string, string>, curr) => {
            acc[curr.id] = curr.name ?? '';
            return acc;
          }, {});

        const required = {
          landColor: war.store.landColor,
          waterColor: war.store.waterColor,
          name: war.store.name,
        };

        return pipe(
          Effect.flatMap(
            O.match(O.all(Object.values(required)), {
              onNone: () =>
                Effect.fail(
                  `Missing required properties to start war: ${Object.keys(
                    required
                  ).join(', ')}`
                ),
              onSome: Effect.succeed,
            }),
            Effect.succeed
          ),
          Effect.flatMap(([land, water, name]) => {
            return Effect.tryPromise({
              try: async () => {
                const newPlanet = await new Promise<string>(async (resolve) => {
                  await database.write(async () => {
                    const { id } = await database
                      .get<Planet>('planets')
                      .create((p: Planet) => {
                        p.name = name;
                        p.landColor = land;
                        p.waterColor = water;
                        p.raised = JSON.stringify(raised);
                      });
                    resolve(id);
                  });
                });

                return new Promise<string>(async (resolve) => {
                  await database.write(async () => {
                    const { id } = await database
                      .get<War>('wars')
                      .create((war) => {
                        war.planet.id = newPlanet;
                        war.players = players;
                        war.status = 'searching-for-players';
                      });
                    resolve(id);
                  });
                });
              },
              catch: (error) => `Error starting war: ${error?.toString()}`,
            });
          }),
          Effect.flatMap((war) => {
            return fetch.post<{ warId: string, playerId: string }>('/conquest', {
              type: 'generate-new-war',
              warId: war,
              players: [],
              playerLimit: store.playerLimit ?? 10,
              roundLimit: store.roundLimit ?? 10,
              battleLimit: store.battleLimit ?? 10,
              tiles: Object.keys(raised).reduce<Record<string, Tile>>(
                (acc, id: string) => {
                  acc[id] = {
                    id: id,
                    owner: 'null',
                    troopCount: 0,
                    habitable: true,
                    name: raised[id],
                    neighborIds: hexasphere.tileLookup[id].neighborIds,
                    originalOwner: 'null',
                  };

                  return acc;
                },
                {}
              ),
            });
          }),
          Effect.flatMap((data: { warId: string, playerId: string }) =>
            Effect.tryPromise({
              try: () => {
                return new Promise<{ warId: string, playerId: string }>(async (resolve) => {
                  await database.write(async () => {
                    const { id } = await database
                      .get<WarUser>('war_users')
                      .create((wu: WarUser) => {
                        wu.warId = data.warId;
                        wu.userId = data.playerId;
                      });
                    resolve(data);
                  });
                });
              },
              catch: () => 'Failed to add user to war for local store',
            })
          )
        );
      },
      getWar: (warId: string) => fetch.get(`/conquest/war/${warId}`),
      connectToWarLog: (
        warId: string,
        callback: (v: string | null) => void
      ) => {
        const socket = io(`${config.webSocketUrl ?? 'localhost:3000'}`, {});
        socket.emit('joinRoom', { roomId: warId });
        socket.on('serverToRoom', (message) => {
          warLog.next(message.toString());
        });
        const subscription = warLog.subscribe(callback);
        return function () {
          subscription.unsubscribe();
          socket.close();
          warLog = new BehaviorSubject<string | null>(null);
        };
      },
      attack: () => {
        return fetch.post('/conquest', {
          type: 'attack',
          battleId: getOrUndefined(war.store.activeBattle),
          warId: getOrUndefined(war.store.warId),
        });
      },
      beginTurnNumber1: () => {
        return fetch.post('/conquest', {
          type: 'begin-turn-number-1',
          warId: getOrUndefined(war.store.warId),
        });
      },
      completeTurn: () => {
        return fetch.post('/conquest', {
          type: 'complete-turn',
          warId: getOrUndefined(war.store.warId),
        });
      },
      startBattle: () => {
        if (war.store.battles.length === war.store.battleLimit) {
          return Effect.succeed(new Response());
        }

        const [defendingTerritoryId] = war.tileIdAndCoords(
          getOrUndefined(war.store.territoryToAttack)
        );
        const [attackingTerritoryId] = war.tileIdAndCoords(
          getOrUndefined(war.store.selectedTileId)
        );
        const defender = war.store.tiles.find(
          (t) => t.id === defendingTerritoryId
        );
        return fetch.post('/conquest', {
          type: 'start-battle',
          attackingFromTerritory: attackingTerritoryId,
          defendingTerritory: defendingTerritoryId,
          aggressor: war.store.currentUsersTurn,
          defender: defender?.owner?.toString() ?? '',
          warId: getOrUndefined(war.store.warId),
        });
      },
      deploy: () => {
        const event = {
          tile: getOrUndefined(war.store.selectedTileId),
          troopsToDeploy: war.store.troopsToDeploy,
          warId: getOrUndefined(war.store.warId),
        };

        if (war.store.troopsToDeploy <= 0) {
          return Effect.succeed(new Response());
        }

        return fetch.post('/conquest', { type: 'deploy', ...event });
      },
      setPortal: () => {
        if (!getOrUndefined(war.store.warId)) {
          return Effect.succeed({} as any);
        }
        if (!war.store.portal[0] || !war.store.portal[1]) {
          return Effect.succeed({} as any);
        }
        return fetch.post('/conquest', {
          type: 'set-portal-entry',
          portal: war.store.portal,
          warId: getOrUndefined(war.store.warId),
        });
      },
      addPlayer: (event: { warId: string }) => {
        return pipe(
          fetch.post<{ player: { id: string } }>('/conquest', {
            type: 'add-player',
            ...event,
          }),
        );
      },
      engage: () => {
        const attacking = war.store.selectedTileId;
        const defending = war.store.territoryToAttack;

        return O.match(O.all([attacking, defending]), {
          onNone: () => {
            return Effect.fail('Selecting attacking and defending tile');
          },
          onSome([attacking, d]) {
            const [defending] = war.tileIdAndCoords(d);
            const battle = war.store.battles.find((battle) => {
              return (
                battle.attackingFromTerritory === attacking &&
                battle.defendingTerritory === defending
              );
            });
            const defender = war.store.tiles.find((t) => t.id === defending);

            if (!battle) {
              if (war.store.battles.length === war.store.battleLimit) {
                return Effect.succeed({} as Response);
              }

              return fetch.post('/conquest', {
                type: 'start-battle',
                attackingFromTerritory: attacking,
                defendingTerritory: defending,
                aggressor: war.store.currentUsersTurn,
                defender: defender?.owner?.toString() ?? '',
                warId: getOrUndefined(war.store.warId),
              });
            }

            return fetch.post('/conquest', {
              type: 'attack',
              battleId: battle.id,
              warId: getOrUndefined(war.store.warId),
            });
          },
        });
      },

      // return O.match(combined, {
      //   onNone: () => {
      //     return Effect.fail("Attacking and defending required");
      //   },
      //   onSome: ([attacking, defending]) => {
      //     return this.attack();
      //   },
      // });
    });
  })
);

const ConquestPipe = pipe(ConquestLive);

export { ConquestService, ConquestPipe, Conquest };
