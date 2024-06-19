import { Context, Effect, Layer, pipe } from 'effect';
import { FetchService } from './fetch.service';
import { Database } from '@nozbe/watermelondb';
import { DbService } from './db.service';

interface EndApi {
  readonly login: (
    userName: string,
    password: string
  ) => Effect.Effect<Response, Error>;
  readonly database: Database;
}

const EndApiService = Context.GenericTag<EndApi>('end-api');

const EndApiLive = Layer.effect(
  EndApiService,
  Effect.gen(function* () {
    const fetch = yield* FetchService;
    const db = yield* DbService;
    const database = yield* db.database();

    return EndApiService.of({
      login: (userName: string, password: string) => {
        return fetch.post('/auth/login', {
          userName,
          password,
        });
      },
      database,
    });
  })
);

const EndApiPipe = pipe(EndApiLive);

export { EndApiService, EndApiPipe, EndApi };
