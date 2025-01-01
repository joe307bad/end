import { Context, Effect, Layer, pipe } from 'effect';
import { syncFactory } from '@end/wm/core';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';
import { getOrUndefined } from 'effect/Option';

interface Sync {
  readonly sync: () => Effect.Effect<void, string>;
}

const SyncService = Context.GenericTag<Sync>('sync-service');

const SyncLive = Layer.effect(
  SyncService,
  Effect.gen(function* () {
    const { database } = yield* DbService;
    const config = yield* ConfigService;
    const sync = syncFactory(yield* database());
    const { getToken } = yield* AuthService;

    return SyncService.of({
      sync: () =>
        pipe(
          Effect.match(getToken(), {
            onSuccess: (token) => getOrUndefined(token),
            onFailure: () => 'Token required',
          }),
          Effect.flatMap((token) =>
            Effect.tryPromise({
              try: () => sync(token, config.apiUrl),
              catch: (error) => error?.toString?.() as string,
            })
          )
        ),
    });
  })
);

const SyncLivePipe = pipe(SyncLive);

export { SyncService, SyncLivePipe, Sync };
