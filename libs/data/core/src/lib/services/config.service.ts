import { Context, Effect, Layer, pipe } from 'effect';

interface Config {
  readonly apiUrl: string;
}

const ConfigService = Context.GenericTag<Config>('config-service');

const ConfigServiceFactory = (apiUrl: string) => {
  const ConfigServiceLive = Layer.effect(
    ConfigService,
    Effect.gen(function* () {
      return ConfigService.of({ apiUrl });
    })
  );

  const ConfigLivePipe = pipe(ConfigServiceLive);

  return { ConfigServiceLive, ConfigLivePipe };
};

export { ConfigService, Config, ConfigServiceFactory };
