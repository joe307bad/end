import { Effect, Layer, pipe } from 'effect';
import { EndApiPipe, EndApiService } from './end-api.service';
import { AuthLiveFactory } from './auth.service';
import { DbLiveFactory } from './db.service';
import { DatabaseAdapter } from '@nozbe/watermelondb';
import { SyncLivePipe, SyncService } from './sync.service';
import { ConfigServiceFactory } from './config.service';
import { FetchLivePipe } from './fetch.service';
import { ConquestPipe, ConquestService } from './conquest.service';

export const program = Effect.gen(function* () {
  return yield* Effect.succeed({
    endApi: yield* EndApiService,
    syncService: yield* SyncService,
    conquestService: yield* ConquestService,
  });
});
const servicesFactory = (
  getToken: () => Promise<string | null>,
  databaseAdapter: DatabaseAdapter,
  apiUrl: string
) => {
  const { AuthLivePipe } = AuthLiveFactory(getToken);
  const { DbLivePipe } = DbLiveFactory(databaseAdapter);
  const { ConfigLivePipe } = ConfigServiceFactory(apiUrl);

  const appLayer = Layer.mergeAll(EndApiPipe, SyncLivePipe, ConquestPipe);

  return Effect.runSync(
    pipe(
      program,
      Effect.provide(
        appLayer.pipe(
          Layer.provide(FetchLivePipe),
          Layer.provide(ConfigLivePipe),
          Layer.provide(DbLivePipe),
          Layer.provideMerge(AuthLivePipe)
        )
      )
    )
  );
};

function execute<T, U>(e: Effect.Effect<T, U>) {
  return Effect.runPromise<T, U>(e);
}

export { servicesFactory, execute };
