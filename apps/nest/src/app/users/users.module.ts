import { Module } from '@nestjs/common';
import { User, UserSchema, UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
  controllers: [UsersController],
})
export class UsersModule {}
