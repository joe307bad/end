import { Effect, Layer, pipe } from 'effect';
import { EndApiPipe, EndApiService } from './end-api.service';
import { AuthLiveFactory } from './auth.service';
import { DbLiveFactory } from './db.service';
import { DatabaseAdapter } from '@nozbe/watermelondb';

export const program = Effect.gen(function* () {
  return yield* Effect.succeed({
    endApi: yield* EndApiService,
  });
});
const servicesFactory = (
  getToken: () => Promise<string | null>,
  databaseAdapter: DatabaseAdapter
) => {
  const { AuthLivePipe } = AuthLiveFactory(getToken);
  const { DbLivePipe } = DbLiveFactory(databaseAdapter);

  return Effect.runSync(
    pipe(
      program,
      Effect.provide(
        Layer.mergeAll(
          EndApiPipe.pipe(
            Layer.provide(DbLivePipe),
            Layer.provideMerge(AuthLivePipe)
          )
        )
      )
    )
  );
};

function execute<T, U,>(e: Effect.Effect<T, U>) {
  return Effect.runPromise<T, U>(e);
}

export { servicesFactory, execute };
