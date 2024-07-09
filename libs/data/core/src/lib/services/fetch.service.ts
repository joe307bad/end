import { Effect, Context, Layer, pipe } from 'effect';
import { ConfigService } from './config.service';

interface Fetch {
  readonly post: <T>(
    route: string,
    body: Record<string, any>,
    token?: string | null
  ) => Effect.Effect<T, Error>;
  readonly get: (route: string) => Effect.Effect<Response, Error>;
}

const FetchService = Context.GenericTag<Fetch>('fetch-service');

const FetchLive = Layer.effect(
  FetchService,
  Effect.gen(function* () {
    const config = yield* ConfigService;
    return FetchService.of({
      post: <T>(
        route: string,
        body: Record<string, any>,
        token?: string | null
      ) => {
        return pipe(
          Effect.tryPromise({
            try: () =>
              fetch(`${config.apiUrl}${route}`, {
                method: 'POST',
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
              }).then((response) => response.json()) as Promise<T>,
            catch: (error) =>
              new Error(`Error fetching ${route}: ${error?.toString()}`),
          })
        );
      },
      get: (route: string) => {
        return Effect.tryPromise({
          try: () => fetch(`${config.apiUrl}${route}`),
          catch: (error) =>
            new Error(`Error fetching ${route}: ${error?.toString()}`),
        });
      },
    });
  })
);

const FetchLivePipe = pipe(FetchLive);

export { FetchService, FetchLivePipe, Fetch };
