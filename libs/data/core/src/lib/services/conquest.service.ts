import { Tile } from '@end/war/core';
import { Effect, Context, Layer, pipe } from 'effect';
import { AuthService } from './auth.service';
import { FetchService } from './fetch.service';
import { Planet, War } from '@end/wm/core';
import { DbService } from './db.service';
import { hexasphere } from '@end/hexasphere';

interface Conquest {
  readonly startWar: (
    planet: {
      name: string;
      raised: string;
      landColor: string;
      waterColor: string;
    },
    players: number
  ) => Effect.Effect<Response, Error>;
  readonly getWar: (warId: string) => Effect.Effect<Response, Error>;
}

const ConquestService = Context.GenericTag<Conquest>('conquest-api');

const ConquestLive = Layer.effect(
  ConquestService,
  Effect.gen(function* () {
    const fetch = yield* FetchService;
    const { getToken } = yield* AuthService;
    const db = yield* DbService;
    const database = yield* db.database();

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
            return fetch.post(
              '/conquest',
              {
                type: 'generate-new-war',
                warId: war,
                players: [],
                tiles: planet.raised
                  .split('|')
                  .reduce<Record<string, Tile>>((acc, cur) => {
                    acc[cur] = {
                      id: '',
                      owner: '',
                      troopCount: 0,
                      habitable: true,
                      neighborIds: hexasphere.tileLookup[cur].neighborIds,
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
    });
  })
);

const ConquestPipe = pipe(ConquestLive);

export { ConquestService, ConquestPipe, Conquest };
