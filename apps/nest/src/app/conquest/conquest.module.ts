import { Module } from '@nestjs/common';
import { ConquestGateway } from './conquest.gateway';
import { ConquestController, War, WarSchema } from './conquest.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Entity, EntitySchema } from '../sync/sync.service';
import { ConquestService } from './conquest.service';
import { UsersModule } from '../users/users.module';
import { CitadelModule } from '../citadel/citadel.module';

@Module({
  imports: [
    CitadelModule,
    UsersModule,
    MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }]),
    MongooseModule.forFeature([{ name: War.name, schema: WarSchema }]),
  ],
  providers: [ConquestGateway, ConquestService],
  controllers: [ConquestController],
  exports: [ConquestService]
})
export class ConquestModule {}
