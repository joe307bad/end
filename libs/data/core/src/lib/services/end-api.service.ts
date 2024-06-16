import { Context, Effect, Layer, pipe } from 'effect';
import { FetchService } from './fetch.service';

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
    const fetch = yield* FetchService;

    return EndApiService.of({
      login: (userName: string, password: string) => {
        return fetch.post('/auth/login', {
          userName,
          password,
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
