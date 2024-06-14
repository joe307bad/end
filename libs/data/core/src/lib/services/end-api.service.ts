import { Context, Effect, Layer, pipe } from 'effect';
import { AuthService } from './auth.service';
import { DbService } from './db.service';
import { ConfigService } from './config.service';

interface EndApi {
  readonly login: (
    userName: string,
    password: string
  ) => Effect.Effect<Response, Error>;

  readonly startWar: (
    planet: {
      name: string;
      raised: string;
      landColor: string;
      waterColor: string;
    },
    players: number
  ) => Effect.Effect<Response>;
}

const EndApiService = Context.GenericTag<EndApi>('end-api');

const EndApiLive = Layer.effect(
  EndApiService,
  Effect.gen(function* () {
    // const conquest = yield* ConquestService;
    const auth = yield* AuthService;
    const database = yield* DbService;
    const config = yield* ConfigService;

    return EndApiService.of({
      login: (userName: string, password: string) => {
        return Effect.tryPromise({
          try: () =>
            fetch(`${config.apiUrl}/auth/login`, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userName,
                password,
              }),
            }),
          catch: (error) => new Error(`Error logging in: ${error?.toString()}`),
        });
      },
      startWar: (
        planet: {
          name: string;
          raised: string;
          landColor: string;
          waterColor: string;
        },
        players: number
      ) => {
        return Effect.succeed({} as any);
      },
    });
  })
);

const EndApiPipe = pipe(EndApiLive);

export { EndApiService, EndApiPipe, EndApi };
