import { Module } from '@nestjs/common';
import { ConquestGateway } from './conquest.gateway';

@Module({
  providers: [ConquestGateway],
})
export class ConquestModule {}

