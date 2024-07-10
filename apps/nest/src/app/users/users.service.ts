import { Injectable } from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  userName: string;

  @Prop({ required: true })
  password: string;

  _id: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

export class CreateUserDto {
  readonly userName: string;
  password: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<{ _id: Types.ObjectId }> {
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel(createUserDto);
    const created = await createdUser.save();
    return { _id: created._id };
  }

  async findOne(userName: string): Promise<User | undefined> {
    return this.userModel.findOne({ userName });
  }
}
