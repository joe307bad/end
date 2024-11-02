import { Context, Effect, Layer, pipe, Option as O } from 'effect';
import { getOrUndefined, Option } from 'effect/Option';
import { UnknownException } from 'effect/Cause';
import { jwtDecode } from 'jwt-decode';

interface Auth {
  readonly getToken: () => Effect.Effect<Option<string>, UnknownException>;
  readonly getUserId: () => Effect.Effect<string, UnknownException>;
}

const AuthService = Context.GenericTag<Auth>('auth-service');

const AuthLiveFactory = (getToken: () => Effect.Effect<Option<string>>) => {
  const AuthLive = Layer.effect(
    AuthService,
    Effect.gen(function* () {
      return AuthService.of({
        getToken: () => getToken(),
        getUserId: () =>
          getToken().pipe(
            Effect.match({
              onSuccess(v) {
                return jwtDecode(getOrUndefined(v) ?? '')?.sub as any;
              },
              onFailure() {
                return 'Could not get token';
              },
            })
          ),
      });
    })
  );

  const AuthLivePipe = pipe(AuthLive);

  return { AuthLive, AuthLivePipe };
};

export { AuthService, Auth, AuthLiveFactory };
