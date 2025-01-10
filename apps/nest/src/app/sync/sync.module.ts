import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [SyncService],
  exports: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
