import { Effect, Context, Layer, pipe } from 'effect';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import { getOrUndefined } from 'effect/Option';

interface Fetch {
  readonly post: <T>(
    route: string,
    body: Record<string, any>
  ) => Effect.Effect<T, string>;
  readonly get: (route: string) => Effect.Effect<Response, string>;
}

const FetchService = Context.GenericTag<Fetch>('fetch-service');

const FetchLive = Layer.effect(
  FetchService,
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const { getToken } = yield* AuthService;
    return FetchService.of({
      post: <T>(route: string, body: Record<string, any>) => {
        return pipe(
          Effect.match(getToken(), {
            onSuccess: (token) => getOrUndefined(token),
            onFailure: () => Effect.fail('Token required'),
          }),
          Effect.flatMap((token) =>
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
              catch: (error) => `Error fetching ${route}: ${error?.toString()}`,
            })
          )
        );
      },
      get: (route: string) => {
        return pipe(
          Effect.match(getToken(), {
            onSuccess: (token) => getOrUndefined(token),
            onFailure: () => Effect.fail('Token required'),
          }),
          Effect.flatMap((token) =>
            Effect.tryPromise({
              try: () =>
                fetch(`${config.apiUrl}${route}`, {
                  method: 'GET',
                  headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                }),
              catch: (error) => `Error fetching ${route}: ${error?.toString()}`,
            })
          )
        );
      },
    });
  })
);

const FetchLivePipe = pipe(FetchLive);

export { FetchService, FetchLivePipe, Fetch };
