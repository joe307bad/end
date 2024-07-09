import { Context, Effect, Layer, pipe } from 'effect';
import { databaseFactory } from '@end/wm/core';
import { DatabaseAdapter } from '@nozbe/watermelondb';

interface Db {
  readonly database: () => Effect.Effect<ReturnType<typeof databaseFactory>>;
}

const DbService = Context.GenericTag<Db>('db-service');

const DbLiveFactory = (databaseAdapter: DatabaseAdapter) => {
  const DbLive = Layer.effect(
    DbService,
    Effect.gen(function* () {
      const database = databaseFactory(databaseAdapter);
      return DbService.of({
        database: () => Effect.succeed(database),
      });
    })
  );

  const DbLivePipe = pipe(DbLive);

  return { DbLive, DbLivePipe };
};

export { Db, DbService, DbLiveFactory }
