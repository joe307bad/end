import { Module } from '@nestjs/common';
import { ConquestGateway } from './conquest.gateway';
import { ConquestController } from './conquest.controller';

@Module({
  providers: [ConquestGateway],
  controllers: [ConquestController],
})
export class ConquestModule {}
