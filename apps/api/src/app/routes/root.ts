import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', async function () {
    return { message: 'Hello API - cd-api-3' };
  });

  fastify.post('/system', async function createSystem (request, reply) {
    // @ts-ignore
    const systemCollection = fastify.mongo.db.collection('systems')
    const result = await systemCollection.insertOne(request.body)
    reply.code(201)
    return { id: result.insertedId }
  })
}
