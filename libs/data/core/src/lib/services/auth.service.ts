import { Context, Effect, Layer, pipe, Option as O } from 'effect';
import { Option } from 'effect/Option';
import { UnknownException } from 'effect/Cause';

interface Auth {
  readonly getToken: () => Effect.Effect<Option<string>, UnknownException>;
}

const AuthService = Context.GenericTag<Auth>('auth-service');

const AuthLiveFactory = (getToken: () => Effect.Effect<Option<string>>) => {
  const AuthLive = Layer.effect(
    AuthService,
    Effect.gen(function* () {
      return AuthService.of({
        getToken: () => getToken(),
      });
    })
  );

  const AuthLivePipe = pipe(AuthLive);

  return { AuthLive, AuthLivePipe };
};

export { AuthService, Auth, AuthLiveFactory };
