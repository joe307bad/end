import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SyncController } from './sync/sync.controller';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    SyncModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_PROD_URL}?authSource=admin`
    ),
    SyncModule,
  ],
  controllers: [AppController, SyncController],
  providers: [AppService],
})
export class AppModule {}
