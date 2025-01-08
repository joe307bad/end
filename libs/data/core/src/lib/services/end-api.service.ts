import { Context, Effect, Layer, pipe } from 'effect';
import { FetchService } from './fetch.service';
import { Database } from '@nozbe/watermelondb';
import { DbService } from './db.service';
import { io } from 'socket.io-client';
import { ConfigService } from './config.service';
import { proxy } from 'valtio';
import * as S from '@effect/schema/Schema';
import { isRight } from 'effect/Either';
import { execute } from '@end/data/core';

type CitadelFeed = {
  leaderboards: {
    battleWinRate: Record<
      string,
      { totalBattles: number; battlesWon: number; change: number }
    >;
    totalTroopCount: Record<string, { value: number; change: number }>;
    totalPlanetsCaptured: Record<string, { value: number; change: number }>;
  };
  latestWars: {
    warId: string;
    userName: string;
    summary: string;
    completed: number;
  }[];
};

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
  readonly connectToUserLog: () => () => void;
  readonly store: EndStore;
  readonly parseUserLog: (message: string) => Effect.Effect<string, string>;
  readonly getLatestCitadelFeed: () => Effect.Effect<CitadelFeed, string>;
}

const EndApiService = Context.GenericTag<EndApi>('end-api');

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
    updatedAt: S.UndefinedOr(S.NullOr(S.Number)),
  }),
});

const BattleStatsSchema = S.Struct({
  totalBattles: S.Number,
  battlesWon: S.Number,
  change: S.Number,
});

const PlanetsStatsSchema = S.Struct({
  value: S.Number,
  change: S.Number,
});

// Define the main Leaderboards schema
const CitadelUpdateSchema = S.Struct({
  type: S.Literal('citadel-update'),
  leaderboards: S.Struct({
    battleWinRate: S.UndefinedOr(
      S.Record({ key: S.String, value: BattleStatsSchema })
    ),
    totalPlanetsCaptured: S.UndefinedOr(
      S.Record({ key: S.String, value: PlanetsStatsSchema })
    ),
  }),
  latestWars: S.Array(
    S.Struct({
      userName: S.String,
      summary: S.String,
      completed: S.Number,
      warId: S.String,
    })
  ),
  updatedAt: S.UndefinedOr(S.NullOr(S.Number)),
});

export type CitadelUpdate = Mutable<S.Schema.Type<typeof CitadelUpdateSchema>>;

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
      updatedAt: number | undefined | null;
    };
  };
  citadel: CitadelFeed | null | 'fetching';
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P] extends Record<string, any>
    ? Mutable<T[P]>
    : T[P];
};

const store = proxy<EndStore>({
  latestWarCache: {},
  citadel: null,
});

export type UpdatedWar = Mutable<S.Schema.Type<typeof UpdatedWarSchema>>;

const UserLogSchema = S.Union(UpdatedWarSchema, CitadelUpdateSchema);

type Result = S.Schema.Type<typeof UserLogSchema>;

const EndApiLive = Layer.effect(
  EndApiService,
  Effect.gen(function* () {
    const fetch = yield* FetchService;
    const db = yield* DbService;
    const database = yield* db.database();
    const config = yield* ConfigService;

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
          Effect.match({
            onSuccess(result: Result) {
              switch (result.type) {
                case 'citadel-update':
                  // @ts-ignore
                  store.citadel = result;
                  break;
                case 'war-change':
                  if (!store.latestWarCache[result.war.id]) {
                    // @ts-ignore
                    store.latestWarCache[result.war.id] = result.war as Mutable<
                      UpdatedWar['war']
                    >;
                    return 'Updated war cache';
                  }

                  Object.keys(result.war).forEach((k: string) => {
                    const key = k as keyof typeof result.war;
                    if (typeof result.war[key] !== 'undefined') {
                      switch (key) {
                        case 'players':
                          store.latestWarCache[result.war.id].players =
                            // @ts-ignore
                            result.war.players as Mutable<
                              UpdatedWar['war']['players']
                            >;
                          break;
                        case 'turn':
                          store.latestWarCache[result.war.id].turn =
                            // @ts-ignore
                            result.war.turn as Mutable<
                              UpdatedWar['war']['turn']
                            >;
                          break;
                        case 'victor':
                          store.latestWarCache[result.war.id].victor =
                            // @ts-ignore
                            result.war.victor as Mutable<
                              UpdatedWar['war']['victor']
                            >;
                          break;
                        case 'updatedAt':
                          // @ts-ignore
                          store.latestWarCache[result.war.id].updatedAt = result
                            .war.updatedAt as Mutable<
                            UpdatedWar['war']['updatedAt']
                          >;
                          break;
                      }
                    }
                  });
              }
              return 'New user log entry';
            },
            onFailure: (e) => 'New user log entry',
          })
        );
      },
      getLatestCitadelFeed() {
        store.citadel = 'fetching';
        return pipe(
          fetch.get<CitadelFeed>('/citadel'),
          Effect.map((r) => {
            // @ts-ignore
            store.citadel = r;
            return r;
          })
        );
      },
      connectToUserLog() {
        const socket = io(`${config.webSocketUrl ?? 'localhost:3000'}`, {});
        socket.emit('joinRoom', { roomId: 'live-updates' });
        socket.on('serverToRoom', (message) => {
          return execute(this.parseUserLog(message));
        });

        return function () {
          socket.close();
        };
      },
      database,
    });
  })
);

const EndApiPipe = pipe(EndApiLive);

export { EndApiService, EndApiPipe, EndApi };
