import { Context, Effect, Layer, pipe } from 'effect';
import { AuthService } from './auth.service';
import { DbService } from './db.service';
import { SyncLivePipe, SyncService } from './sync.service';

interface EndApi {
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
    // const conquest = yield* ConquestService;
    const auth = yield* AuthService;
    const database = yield* DbService;
    // const config = yield* ConfigService;

    return EndApiService.of({
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

const EndApiPipe = pipe(EndApiLive);

export { EndApiService, EndApiPipe, EndApi };
