import { Context, Effect, Layer, pipe } from 'effect';
import { FetchService } from './fetch.service';
import { Database, Model, Q } from '@nozbe/watermelondb';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { WarService } from './war/WarService';
import { Planet, User, War } from '@end/wm/core';
import { SyncService } from './sync.service';

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
        const passwordId = () =>
          Effect.tryPromise({
            try: () =>
              database
                .get('users')
                .query(Q.where('userName', userName))
                .fetch(),
            catch: () => `Failed to get passwordId for user ${userName}`,
          });

        return pipe(
          Effect.tryPromise({
            try: () =>
              database
                .get<User>('users')
                .query(Q.where('userName', userName))
                .fetch()
                .then((r) => r[0]),
            catch: () => `Failed to get passwordId for user ${userName}`,
          }),
          Effect.flatMap((result) =>
            fetch.post<{ access_token: string }>('/auth/login', {
              passwordId: result?.password_id,
              password,
            })
          )
        );
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
            return fetch.post<{ access_token: string; password_id: string }>(
              '/auth/register',
              { userName, password }
            );
          }),
          Effect.flatMap((data) => {
            debugger;
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
                        u.password_id = data.password_id;
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
