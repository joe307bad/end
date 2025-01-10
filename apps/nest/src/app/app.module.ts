import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { SharedService } from './shared/shared.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SyncController } from './sync/sync.controller';
import { SyncModule } from './sync/sync.module';
import { ConquestModule } from './conquest/conquest.module';
import { CitadelModule } from './citadel/citadel.module';

require('dotenv').config();

const host = process.env.REDIS_HOST ?? 'localhost';
const password = process.env.REDIS_PASSWORD
  ? { password: process.env.REDIS_PASSWORD }
  : undefined;

console.log({ host, password });

@Module({
  imports: [
    MongooseModule.forRoot(
      `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_PROD_URL}`,
      { dbName: 'end', directConnection: true }
    ),
    ConfigModule.forRoot(),
    AuthModule,
    UsersModule,
    SyncModule,
    ConquestModule,
    CitadelModule,
  ],
  controllers: [AppController],
  providers: [],
  exports: [],
})
export class AppModule {}
