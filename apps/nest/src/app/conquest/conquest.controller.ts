import { Body, Controller, Post, Query } from '@nestjs/common';
import { SyncDatabaseChangeSet } from '@nozbe/watermelondb/sync';

@Controller('conquest')
export class ConquestController {
  @Post('queue')
  queue(@Body() warId: string) {
    return warId;
  }
}
