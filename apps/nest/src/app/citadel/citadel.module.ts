import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Entity, EntitySchema } from '../sync/sync.service';
import { CitadelFeedSchema, CitadelService } from './citadel.service';
import { War, WarSchema } from '../conquest/conquest.controller';
import { CitadelQueueProcessor } from './citadel.queue-processor';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'citadel-feed-queue',
    }),
    MongooseModule.forFeature([
      {
        name: 'citadel-feed',
        collection: 'citadel-feed',
        schema: CitadelFeedSchema,
      },
    ]),
    MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }]),
    MongooseModule.forFeature([{ name: War.name, schema: WarSchema }]),
  ],
  providers: [CitadelService, CitadelQueueProcessor],
  exports: [CitadelService],
})
export class CitadelModule {}
