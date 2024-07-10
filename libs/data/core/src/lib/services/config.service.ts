import { Context, Effect, Layer, pipe } from 'effect';

interface Config {
  readonly apiUrl: string;
  readonly webSocketUrl: string;
}

const ConfigService = Context.GenericTag<Config>('config-service');

const ConfigServiceFactory = (apiUrl: string, webSocketUrl: string) => {
  const ConfigServiceLive = Layer.effect(
    ConfigService,
    Effect.gen(function* () {
      return ConfigService.of({ apiUrl, webSocketUrl });
    })
  );

  const ConfigLivePipe = pipe(ConfigServiceLive);

  return { ConfigServiceLive, ConfigLivePipe };
};

export { ConfigService, Config, ConfigServiceFactory };
