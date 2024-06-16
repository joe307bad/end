import { Event } from '@end/war/core';
import { Effect, Context, Layer, pipe } from 'effect';
import { AuthService } from './auth.service';
import { FetchService } from './fetch.service';

interface Conquest {
  readonly log: (event: Event) => Effect.Effect<Response, Error>;
}

const ConquestService = Context.GenericTag<Conquest>('conquest-api');

const ConquestLive = Layer.effect(
  ConquestService,
  Effect.gen(function* () {
    const fetch = yield* FetchService;
    const { getToken } = yield* AuthService;

    return ConquestService.of({
      log: (event: Event) => {
        return pipe(
          getToken(),
          Effect.flatMap((token: string|null) => {
            return fetch.post('/conquest', event, token);
          })
        );
      },
    });
  })
);

const ConquestPipe = pipe(ConquestLive);

export { ConquestService, ConquestPipe, Conquest };
