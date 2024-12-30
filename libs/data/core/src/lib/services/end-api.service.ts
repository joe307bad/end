import { Context, Effect, Layer, pipe } from 'effect';
import { FetchService } from './fetch.service';
import { Database } from '@nozbe/watermelondb';
import { DbService } from './db.service';
import { io } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { ConfigService } from './config.service';
import { proxy } from 'valtio';
import * as S from '@effect/schema/Schema';
import { isRight } from 'effect/Either';
import { execute } from '@end/data/core';

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
  readonly connectToUserLog: (
    userId: string,
    callback: (v: string | null) => void
  ) => () => void;
  readonly store: EndStore;
  readonly parseUserLog: (message: string) => Effect.Effect<string, string>;
}

const EndApiService = Context.GenericTag<EndApi>('end-api');

interface EndStore {
  latestWarCache: {
    [key: string]: {
      id: string;
      players:
        | {
            id: string;
            userName: string;
            color: string;
          }[]
        | undefined
        | null;
      turn: string | undefined | null;
      victor: string | undefined | null;
      status: string | undefined | null;
    };
  };
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P] extends Record<string, any>
    ? Mutable<T[P]>
    : T[P];
};

const store = proxy<EndStore>({
  latestWarCache: {},
});

const UpdatedWarSchema = S.Struct({
  type: S.Literal('war-change'),
  war: S.Struct({
    id: S.String,
    players: S.UndefinedOr(
      S.Array(S.Struct({ id: S.String, userName: S.String, color: S.String }))
    ),
    turn: S.UndefinedOr(S.NullOr(S.String)),
    victor: S.UndefinedOr(S.NullOr(S.String)),
    status: S.UndefinedOr(S.NullOr(S.String)),
  }),
});

export type UpdatedWar = Mutable<S.Schema.Type<typeof UpdatedWarSchema>>;

const UserLogSchema = S.Union(UpdatedWarSchema);

const EndApiLive = Layer.effect(
  EndApiService,
  Effect.gen(function* () {
    const fetch = yield* FetchService;
    const db = yield* DbService;
    const database = yield* db.database();
    const config = yield* ConfigService;
    let userLog = new BehaviorSubject<string | null>(null);

    return EndApiService.of({
      store,
      login: (userName: string, password: string) => {
        return fetch.post<{ access_token: string }>('/auth/login', {
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
            return fetch.post<{ access_token: string; password_id: string }>(
              '/auth/register',
              { userName, password }
            );
          })
        );
      },
      leaderboard() {
        return fetch.get('/leaderboard');
      },
      parseUserLog: (message: string) => {
        return pipe(
          Effect.try({
            try: () => JSON.parse(message),
            catch: (e) => {
              return 'Failed to parse user log entry. Invalid json.';
            },
          }),
          Effect.flatMap((parsed) => {
            const valid = S.decodeEither(UserLogSchema)(parsed);

            if (isRight(valid)) {
              return Effect.succeed(valid.right);
            }

            return Effect.fail(
              'Failed to parse user log entry. Entry did not match any known schema.'
            );
          }),
          Effect.flatMap((result: UpdatedWar) => {
            Object.keys(result.war).forEach((k: string) => {
              const key = k as keyof typeof result.war;
              if (
                typeof result.war[key] !== 'undefined' &&
                store.latestWarCache[result.war.id]
              ) {
                switch (key) {
                  case 'players':
                    store.latestWarCache[result.war.id].players = result.war
                      .players as Mutable<UpdatedWar['war']['players']>;
                    break;
                  case 'turn':
                    store.latestWarCache[result.war.id].turn = result.war
                      .turn as Mutable<UpdatedWar['war']['turn']>;
                    break;
                  case 'victor':
                    store.latestWarCache[result.war.id].victor = result.war
                      .victor as Mutable<UpdatedWar['war']['victor']>;
                    break;
                }
              } else {
                // @ts-ignore
                store.latestWarCache[result.war.id] = result.war as Mutable<
                  UpdatedWar['war']
                >;
              }
            });

            return Effect.succeed('Updated war cache');
          })
        );
      },
      connectToUserLog(userId: string, callback: (v: string | null) => void) {
        const socket = io(`${config.webSocketUrl ?? 'localhost:3000'}`, {});
        socket.emit('joinRoom', { roomId: 'live-updates' });
        socket.on('serverToRoom', (message) =>
          execute(this.parseUserLog(message))
        );
        const subscription = userLog.subscribe(callback);
        return function () {
          subscription.unsubscribe();
          socket.close();
          userLog = new BehaviorSubject<string | null>(null);
        };
      },
      database,
    });
  })
);

const EndApiPipe = pipe(EndApiLive);

export { EndApiService, EndApiPipe, EndApi };
