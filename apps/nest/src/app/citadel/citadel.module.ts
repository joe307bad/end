import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Entity, EntitySchema } from '../sync/sync.service';
import { CitadelFeedSchema, CitadelService } from './citadel.service';
import { War, WarSchema } from '../conquest/conquest.controller';
import { CitadelQueue } from './citadel.queue';
import { BullModule } from '@nestjs/bull';
import { ConquestModule } from '../conquest/conquest.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    SharedModule,
    BullModule.registerQueue({
      name: 'citadel-queue',
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
  providers: [CitadelService, CitadelQueue],
  exports: [CitadelService],
})
export class CitadelModule {}
