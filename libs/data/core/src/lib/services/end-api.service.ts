import { Context, Effect, Layer, pipe } from 'effect';
import { FetchService } from './fetch.service';

interface EndApi {
  readonly login: (
    userName: string,
    password: string
  ) => Effect.Effect<Response, Error>;
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
    });
  })
);

const EndApiPipe = pipe(EndApiLive);

export { EndApiService, EndApiPipe, EndApi };
