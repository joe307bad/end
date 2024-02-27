import { Module } from '@nestjs/common';
import { Entity, EntitySchema, SyncService } from './sync.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SyncController } from './sync.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }]),
  ],
  providers: [SyncService],
  exports: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
