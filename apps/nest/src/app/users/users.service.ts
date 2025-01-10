import { Injectable } from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { Entity } from '../shared/schemas/entity.schema';

@Schema()
export class User {
  @Prop({ required: true })
  password: string;

  _id: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

export class CreateUserDto {
  password: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Entity.name) private entityModel: Model<Entity>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ _id: Types.ObjectId }> {
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel(createUserDto);
    const created = await createdUser.save();
    return { _id: created._id };
  }

  async findByPasswordId(passwordId: string): Promise<User | undefined> {
    return this.userModel.findOne({ _id: passwordId });
  }

  async findByUserName(
    userName: string
  ): Promise<{ password_id: string, _id: string } | null> {
    return this.entityModel.findOne({ table: 'users', userName });
  }

  async findById(
    _id: string
  ): Promise<{ password_id: string, _id: string, userName: string } | null> {
    return this.entityModel.findOne({ table: 'users', _id });
  }

  async findUserNameByPasswordId(
    passwordId: string
  ): Promise<{ userName: string; _id: string } | null> {
    return this.entityModel.findOne({ table: 'users', password_id: passwordId });
  }

  async checkUsernameAvailability(userName: string): Promise<boolean> {
    return this.entityModel
      .findOne({ table: 'users', userName })
      .then((r) => !!r);
  }
}
