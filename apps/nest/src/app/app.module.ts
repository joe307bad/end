import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SyncController } from './sync/sync.controller';
import { SyncModule } from './sync/sync.module';
import { ConquestModule } from './conquest/conquest.module';
import { CitadelService } from './citadel/citadel.service';
import { BullModule } from '@nestjs/bull';
import { CitadelQueueProcesser } from './citadel/citadel.queue-processor';
import { War, WarSchema } from './conquest/conquest.controller';
import { Entity, EntitySchema } from './sync/sync.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    SyncModule,
    ConquestModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_PROD_URL}`,
      { dbName: 'end', directConnection: true }
    ),
    MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }]),
    MongooseModule.forFeature([{ name: War.name, schema: WarSchema }]),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'citadel-recalculation-queue',
    }),
  ],
  controllers: [AppController, SyncController],
  providers: [AppService, CitadelService, CitadelQueueProcesser],
})
export class AppModule {}
