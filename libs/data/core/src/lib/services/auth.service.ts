import { Context, Effect, Layer, pipe } from 'effect';
import { UnknownException } from 'effect/Cause';

interface Auth {
  readonly getToken: () => Effect.Effect<string | null, UnknownException>;
}

const AuthService = Context.GenericTag<Auth>('auth-service');

const AuthLiveFactory = (getToken: () => Promise<string | null>) => {
  const AuthLive = Layer.effect(
    AuthService,
    Effect.gen(function* () {
      return AuthService.of({
        getToken: () => Effect.tryPromise(getToken),
      });
    })
  );

  const AuthLivePipe = pipe(AuthLive);

  return { AuthLive, AuthLivePipe };
};

export { AuthService, Auth, AuthLiveFactory };
