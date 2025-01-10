import { forwardRef, Module } from '@nestjs/common';
import { ConquestGateway } from './conquest.gateway';
import { ConquestController } from './conquest.controller';
import { UsersModule } from '../users/users.module';
import { SharedModule } from '../shared/shared.module';
import { CitadelModule } from '../citadel/citadel.module';

@Module({
  imports: [
    SharedModule,
    CitadelModule,
    UsersModule,
  ],
  providers: [ConquestGateway],
  controllers: [ConquestController],
  exports: []
})
export class ConquestModule {}
