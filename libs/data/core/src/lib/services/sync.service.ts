import { Context, Effect, Layer, pipe } from 'effect';
import { syncFactory } from '@end/wm/core';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';

interface Sync {
  readonly sync: () => Effect.Effect<void, Error>;
}

const SyncService = Context.GenericTag<Sync>('sync-service');

const SyncLive = Layer.effect(
  SyncService,
  Effect.gen(function* () {
    const { database } = yield* DbService;
    const { getToken } = yield* AuthService;
    const config = yield* ConfigService;
    const sync = syncFactory(yield* database());

    return SyncService.of({
      sync: () => {
        return pipe(
          getToken(),
          Effect.flatMap((token) =>
            Effect.tryPromise({
              try: () => sync(token, config.apiUrl),
              catch: (error) =>
                new Error(`Error during synchronization: ${error?.toString()}`),
            })
          )
        );
      },
    });
  })
);

const SyncLivePipe = pipe(SyncLive);

export { SyncService, SyncLivePipe, Sync };
