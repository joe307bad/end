import { Context, Effect, Layer, pipe } from 'effect';
import { FetchService } from './fetch.service';
import { Database } from '@nozbe/watermelondb';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { WarService } from './war/WarService';

interface EndApi {
  readonly login: (
    userName: string,
    password: string
  ) => Effect.Effect<{ access_token: string }, string>;
  readonly register: (
    userName: string,
    password: string,
    confirmPassword: string
  ) => Effect.Effect<{ access_token: string }, string>;
  readonly database: Database;
}

const EndApiService = Context.GenericTag<EndApi>('end-api');

const EndApiLive = Layer.effect(
  EndApiService,
  Effect.gen(function* () {
    const fetch = yield* FetchService;
    const db = yield* DbService;
    const database = yield* db.database();
    const war = yield* WarService;

    return EndApiService.of({
      login: (userName: string, password: string) => {
        return fetch.post('/auth/login', {
          userName,
          password,
        });
      },
      register: (
        userName: string,
        password: string,
        confirmPassword: string
      ) => {
        return pipe(
          Effect.suspend(() =>
            password != '' && confirmPassword === password
              ? Effect.succeed('Passwords match')
              : Effect.fail('Password confirmation does not match')
          ),
          Effect.flatMap(() => {
            return fetch.post('/auth/register', {
              userName,
              password,
            });
          })
        );
      },
      database,
    });
  })
);

const EndApiPipe = pipe(EndApiLive);

export { EndApiService, EndApiPipe, EndApi };
