import * as path from 'path';
import { FastifyInstance } from 'fastify';
import AutoLoad from '@fastify/autoload';

/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  // Place here your custom code!

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: { ...opts },
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: { ...opts },
  });

  await fastify.register(require('@fastify/env'), {
    schema: {
      type: 'object',
      properties: {
        PORT: { type: 'integer', default: 3000 },
        NODE_ENV: { type: 'string' },
        MONGO_URL: { type: 'string' },
      },
    },
  });

  fastify.register(require('@fastify/cors'), {
    origin: '*',
    methods: ['POST'],
  });

  fastify.register(require('@fastify/mongodb'), {
    url: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_PROD_URL}/end?authSource=admin`,
  });
}
