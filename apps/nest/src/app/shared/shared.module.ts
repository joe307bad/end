import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/users.service';
import { Entity, EntitySchema } from './schemas/entity.schema';
import { War, WarSchema } from './schemas/war.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Entity.name, schema: EntitySchema },
      { name: War.name, schema: WarSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [SharedService],
  exports: [SharedService, MongooseModule],
})
export class SharedModule {}
