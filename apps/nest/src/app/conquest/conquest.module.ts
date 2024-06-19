import { Module } from '@nestjs/common';
import { ConquestGateway } from './conquest.gateway';
import { ConquestController, War, WarSchema } from './conquest.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Entity, EntitySchema } from '../sync/sync.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }]),
    MongooseModule.forFeature([{ name: War.name, schema: WarSchema }]),
  ],
  providers: [ConquestGateway],
  controllers: [ConquestController],
})
export class ConquestModule {}
