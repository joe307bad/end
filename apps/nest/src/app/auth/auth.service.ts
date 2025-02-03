import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { generateRandomId } from '../shared';
import { Entity } from '../shared/schemas/entity.schema';
import { CodeService } from '../code/code.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private codeService: CodeService,
    @InjectModel(Entity.name) private entityModel: Model<Entity>
  ) {}

  async signIn(
    userName: string,
    pass: string
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findByUserName(userName);
    const userPassword = await this.usersService.findByPasswordId(
      user?.password_id
    );

    if (!(await bcrypt.compare(pass, userPassword.password))) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user._id };
    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.NEST_JWT_SECRET,
      }),
    };
  }

  async register(
    userName: string,
    password: string,
    code: string
  ): Promise<{ access_token: string; password_id: string }> {
    const codeId = await this.codeService.codeExists(code);

    if (!codeId) {
      throw new HttpException('Invalid code', 400);
    }

    const existingUser = await this.usersService.checkUsernameAvailability(
      userName
    );

    if (existingUser) {
      throw new HttpException('Username taken', 400);
    }

    const { _id } = await this.usersService.create({ password });
    const userId = generateRandomId();

    const now = Date.now();
    await this.entityModel.create({
      _id: userId,
      table: 'users',
      userName: userName,
      password_id: _id,
      created_on_server: now,
      created_at: now,
    });
    const payload = { sub: userId };

    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.NEST_JWT_SECRET,
      }),
      password_id: _id.toString(),
    };
  }
}
