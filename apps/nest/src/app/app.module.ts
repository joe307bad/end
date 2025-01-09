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
import { BullModule } from '@nestjs/bull';
import { War, WarSchema } from './conquest/conquest.controller';
import { Entity, EntitySchema } from './sync/sync.service';
import { CitadelModule } from './citadel/citadel.module';
require('dotenv').config()

const host = process.env.REDIS_HOST ?? 'localhost';
const password = process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : undefined;

console.log({host, password})

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host,
        family: 6,
        port: 6379,
        ...password
      },
    }),
    AuthModule,
    UsersModule,
    SyncModule,
    ConquestModule,
    CitadelModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_PROD_URL}`,
      { dbName: 'end', directConnection: true }
    ),
    MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }]),
    MongooseModule.forFeature([{ name: War.name, schema: WarSchema }]),
  ],
  controllers: [AppController, SyncController],
  providers: [SharedService],
  exports: [SharedService]
})
export class AppModule {}
