import { Context, Effect, Layer, pipe } from 'effect';
import { FetchService } from './fetch.service';
import { Database } from '@nozbe/watermelondb';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { WarService } from './war/WarService';
import { Planet, User } from '@end/wm/core';

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
  readonly leaderboard: () => Effect.Effect<Response, string>;
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
      register: (
        userName: string,
        password: string,
        confirmPassword: string
      ) => {
        // TODO after registering, store the user in the local-first store
        return pipe(
          Effect.suspend(() =>
            password != '' && confirmPassword === password
              ? Effect.succeed('Passwords match')
              : Effect.fail('Password confirmation does not match')
          ),
          Effect.flatMap(() => {
            return fetch.post<{ access_token: string; passwordId: string }>(
              '/auth/register',
              {
                userName,
                password,
              }
            );
          }),
          Effect.flatMap((data) => {
            if (!data.access_token) {
              return Effect.fail((data as any)?.message);
            }
            return Effect.tryPromise({
              try: () =>
                new Promise<{ access_token: string }>((resolve) => {
                  database.write(async () => {
                    const { id } = await database
                      .get<User>('users')
                      .create((u: User) => {
                        u.userName = userName;
                        u.passwordId = data.passwordId;
                      });
                    resolve({ access_token: data.access_token });
                  });
                }),
              catch: () => 'Failed to write user to local store',
            });
          })
        );
      },
      leaderboard() {
        return fetch.get('/leaderboard');
      },
      database,
    });
  })
);

const EndApiPipe = pipe(EndApiLive);

export { EndApiService, EndApiPipe, EndApi };
