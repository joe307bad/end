import { Tile } from '@end/war/core';
import { Effect, Context, Layer, pipe } from 'effect';
import { AuthService } from './auth.service';
import { FetchService } from './fetch.service';
import { Planet, War } from '@end/wm/core';
import { DbService } from './db.service';
import { hexasphere } from '@end/hexasphere';
import { BehaviorSubject } from 'rxjs';
import { io } from 'socket.io-client';
import { ConfigService } from './config.service';

interface Conquest {
  readonly startWar: (
    planet: {
      name: string;
      raised: string;
      landColor: string;
      waterColor: string;
    },
    players: number
  ) => Effect.Effect<{ warId: string }, Error>;
  readonly getWar: (warId: string) => Effect.Effect<Response, Error>;
  readonly connectToWarLog: (warId: string) => BehaviorSubject<string | null>;
  readonly createWarLogEvent: (warId: string) => void;
  readonly attack: (payload: {
    tile1: string;
    tile2: string;
    warId: string;
  }) => Effect.Effect<Response, Error>;
  readonly selectFirstTerritory: (payload: {
    id: string;
    warId: string;
  }) => Effect.Effect<Response, Error>;
}

const ConquestService = Context.GenericTag<Conquest>('conquest-api');

const ConquestLive = Layer.effect(
  ConquestService,
  Effect.gen(function* () {
    const fetch = yield* FetchService;
    const { getToken } = yield* AuthService;
    const db = yield* DbService;
    const config = yield* ConfigService;
    const database = yield* db.database();
    const warLog = new BehaviorSubject<string | null>(null);
    const socket = io(`${config.webSocketUrl ?? 'localhost:3000'}`, {});
    socket.on('connect', () => {
      warLog.next(socket?.id ?? '');
    });
    const sender = Math.random();

    return ConquestService.of({
      startWar: (
        planet: {
          name: string;
          raised: string;
          landColor: string;
          waterColor: string;
        },
        players: number
      ) => {
        return pipe(
          getToken(),
          Effect.flatMap((token) => {
            return Effect.tryPromise({
              try: async () => {
                const newPlanet = await new Promise<string>(async (resolve) => {
                  await database.write(async () => {
                    const { id } = await database
                      .get<Planet>('planets')
                      .create((p: Planet) => {
                        p.name = planet.name;
                        p.landColor = planet.landColor;
                        p.waterColor = planet.waterColor;
                        p.raised = planet.raised;
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
              catch: (error) =>
                new Error(`Error starting war: ${error?.toString()}`),
            });
          }),
          Effect.flatMap((war) => {
            return getToken().pipe(Effect.map((token) => ({ war, token })));
          }),
          Effect.flatMap(({ war, token }) => {
            return fetch.post<{ warId: string }>(
              '/conquest',
              {
                type: 'generate-new-war',
                warId: war,
                players: [],
                tiles: planet.raised
                  .split('|')
                  .reduce<Record<string, Tile>>((acc, cur) => {
                    const [id, name] = cur.split(":");
                    acc[cur] = {
                      id: '',
                      owner: 0,
                      troopCount: 0,
                      habitable: true,
                      name,
                      neighborIds: hexasphere.tileLookup[id].neighborIds,
                    };

                    return acc;
                  }, {}),
              },
              token
            );
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
      createWarLogEvent: (warId: string) => {
        socket.emit('roomToServer', `${warId}|${sender}|attack-1-2-3}`);
      },
      attack: (event: { tile1: string; tile2: string; warId: string }) => {
        return pipe(
          getToken(),
          Effect.flatMap((token) =>
            fetch.post('/conquest', { type: 'attack', ...event }, token)
          )
        );
      },
      selectFirstTerritory: (event: { id: string; warId: string }) => {
        return pipe(
          getToken(),
          Effect.flatMap((token) =>
            fetch.post(
              '/conquest',
              { type: 'select-first-territory', ...event },
              token
            )
          )
        );
      },
    });
  })
);

const ConquestPipe = pipe(ConquestLive);

export { ConquestService, ConquestPipe, Conquest };
