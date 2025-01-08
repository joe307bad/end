import { Module } from '@nestjs/common';
import { ConquestGateway } from './conquest.gateway';
import { ConquestController, War, WarSchema } from './conquest.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Entity, EntitySchema } from '../sync/sync.service';
import { UsersModule } from '../users/users.module';
import { SharedModule } from '../shared/shared.module';
import { CitadelModule } from '../citadel/citadel.module';

@Module({
  imports: [
    CitadelModule,
    SharedModule,
    UsersModule,
    MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }]),
    MongooseModule.forFeature([{ name: War.name, schema: WarSchema }]),
  ],
  providers: [ConquestGateway],
  controllers: [ConquestController],
  exports: []
})
export class ConquestModule {}
