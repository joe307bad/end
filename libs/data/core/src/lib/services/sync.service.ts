import { Context, Effect, Layer, pipe } from 'effect';
import { syncFactory } from '@end/wm/core';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { UnknownException } from 'effect/Cause';

interface Sync {
  readonly sync: () => Effect.Effect<string | null, UnknownException>;
}

const SyncService = Context.GenericTag<Sync>('sync-service');

const SyncLive = Layer.effect(
  SyncService,
  Effect.gen(function* () {
    const { database } = yield* DbService;
    const { getToken } = yield* AuthService;
    // const apiUrl = yield* ConfigService;
    const sync = syncFactory(yield* database());

    return SyncService.of({
      sync: () => {
        console.log({ database });
        return pipe(
          getToken(),
          Effect.map((token) => {
            console.log({ token });
            return '' as any;
          })
        );
      },
    });
  })
);

const SyncLivePipe = pipe(SyncLive);

export { SyncService, SyncLivePipe, Sync };
