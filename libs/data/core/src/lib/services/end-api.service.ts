import { Context, Effect, Layer, pipe } from 'effect';
import { SyncLivePipe, SyncService } from './sync.service';
import { UnknownException } from 'effect/Cause';

interface EndApi {
  readonly sync: () => Effect.Effect<string | null, UnknownException>;

  readonly login: (
    userName: string,
    password: string
  ) => Effect.Effect<Response>;

  readonly startWar: (
    planet: {
      name: string;
      raised: string;
      landColor: string;
      waterColor: string;
    },
    players: number
  ) => Effect.Effect<Response>;
}

const EndApiService = Context.GenericTag<EndApi>('end-api');

const EndApiLive = Layer.effect(
  EndApiService,
  Effect.gen(function* () {
    const { sync } = yield* SyncService;
    // const conquest = yield* ConquestService;
    // const auth = yield* AuthService;
    // const database = yield* DbService;
    // const config = yield* ConfigService;

    return EndApiService.of({
      sync,
      login: (userName: string, password: string) => {
        return Effect.succeed({} as any);
      },
      startWar: (
        planet: {
          name: string;
          raised: string;
          landColor: string;
          waterColor: string;
        },
        players: number
      ) => {
        return Effect.succeed({} as any);
      },
    });
  })
);

const EndApiPipe = pipe(EndApiLive, Layer.provide(SyncLivePipe));

export { EndApiService, EndApiPipe, EndApi };
