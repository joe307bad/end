import { Module } from '@nestjs/common';
import { ConquestGateway } from './conquest.gateway';
import { ConquestController } from './conquest.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Entity, EntitySchema } from '../sync/sync.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }]),
  ],
  providers: [ConquestGateway],
  controllers: [ConquestController],
})
export class ConquestModule {}
