import { Context, Effect, Layer, pipe } from 'effect';

export interface ConquestService {
  readonly log: () => Effect.Effect<{ logId: string }>;
}

const ConquestService = Context.GenericTag<ConquestService>('conquest-service');

export interface WarService {
  readonly create: () => Effect.Effect<{ id: string }>;
}

const WarService = Context.GenericTag<WarService>('war-service');

export interface AuthService {
  readonly getToken: () => Effect.Effect<string>;
}

const AuthService = Context.GenericTag<AuthService>('auth-service');

const ConquestServiceLive = Layer.effect(
  ConquestService,
  Effect.gen(function* () {
    const war = yield* WarService;
    const auth = yield* AuthService;

    return {
      log: () =>
        pipe(
          Effect.all([war.create(), auth.getToken()]),
          Effect.map((res) => ({ logId: JSON.stringify(res) }))
        ),
    };
  })
);
const WarServiceLive = Layer.effect(
  WarService,
  Effect.gen(function* () {
    const auth = yield* AuthService;

    return {
      create: () =>
        Effect.gen(function* () {
          console.log('hey');
          const token = yield* auth.getToken();
          return { id: token };
        }),
    };
  })
);

const AuthServiceLive = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    return AuthService.of({
      getToken: () => Effect.succeed('token-herffe'),
    });
  })
);

const WarServicePipe = pipe(
  WarServiceLive,
  Layer.provideMerge(AuthServiceLive)
);

const ConquestServicePipe = pipe(
  ConquestServiceLive,
  Layer.provide(WarServicePipe)
);

const program = Effect.gen(function* () {
  return yield* Effect.succeed({
    auth: yield* AuthService,
    war: yield* WarService,
    conquest: yield* ConquestService,
  });
});

const appLayer = Layer.mergeAll(WarServicePipe, ConquestServicePipe);
const services = Effect.runSync(pipe(program, Effect.provide(appLayer)));

export { services };
