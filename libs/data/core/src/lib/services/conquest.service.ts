import { Tile } from '@end/war/core';
import { Effect, Context, Layer, pipe, Option as O } from 'effect';
import { FetchService } from './fetch.service';
import { Planet, War } from '@end/wm/core';
import { DbService } from './db.service';
import { BehaviorSubject } from 'rxjs';
import { io } from 'socket.io-client';
import { ConfigService } from './config.service';
import { hexasphere } from '@end/shared';
import { WarService } from './war.service';

interface Conquest {
  readonly startWar: (
    players: number
  ) => Effect.Effect<{ warId: string }, string>;
  readonly getWar: (warId: string) => Effect.Effect<Response, string>;
  readonly connectToWarLog: (warId: string) => BehaviorSubject<string | null>;
  readonly attack: (payload: {
    tile1: string;
    tile2: string;
    warId: string;
  }) => Effect.Effect<Response, string>;
  readonly addPlayer: (payload: {
    warId: string;
  }) => Effect.Effect<Response, string>;
  readonly selectFirstTerritory: (payload: {
    id: string;
    warId: string;
  }) => Effect.Effect<Response, string>;
}

const ConquestService = Context.GenericTag<Conquest>('conquest-api');

const ConquestLive = Layer.effect(
  ConquestService,
  Effect.gen(function* () {
    const fetch = yield* FetchService;
    const db = yield* DbService;
    const config = yield* ConfigService;
    const war = yield* WarService;
    const database = yield* db.database();
    const warLog = new BehaviorSubject<string | null>(null);
    const socket = io(`${config.webSocketUrl ?? 'localhost:3000'}`, {});
    socket.on('connect', () => {
      warLog.next(socket?.id ?? '');
    });

    return ConquestService.of({
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
                      });
                    resolve(id);
                  });
                });
              },
              catch: (error) => `Error starting war: ${error?.toString()}`,
            });
          }),
          Effect.flatMap((war) => {
            return fetch.post<{ warId: string }>('/conquest', {
              type: 'generate-new-war',
              warId: war,
              players: [],
              tiles: Object.keys(raised).reduce<Record<string, Tile>>(
                (acc, id: string) => {
                  acc[id] = {
                    id: id,
                    owner: 0,
                    troopCount: 0,
                    habitable: true,
                    name: raised[id],
                    neighborIds: hexasphere.tileLookup[id].neighborIds,
                  };

                  return acc;
                },
                {}
              ),
            });
          })
        );
      },
      getWar: (warId: string) => fetch.get(`/conquest/war/${warId}`),
      connectToWarLog: (warId: string) => {
        socket.emit('joinRoom', { warId: warId });
        socket.on('serverToRoom', (message) => {
          warLog.next(message.toString());
        });
        return warLog;
      },
      attack: (event: { tile1: string; tile2: string; warId: string }) => {
        return fetch.post('/conquest', { type: 'attack', ...event });
      },
      addPlayer: (event: { warId: string }) => {
        return fetch.post('/conquest', { type: 'add-player', ...event });
      },
      selectFirstTerritory: (event: { id: string; warId: string }) => {
        return fetch.post('/conquest', {
          type: 'select-first-territory',
          ...event,
        });
      },
    });
  })
);

const ConquestPipe = pipe(ConquestLive);

export { ConquestService, ConquestPipe, Conquest };
