import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn(
    userName: string,
    pass: string
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findByUserName(userName);
    const userPassword = await this.usersService.findByPasswordId(user?.password_id);

    if (!(await bcrypt.compare(pass, userPassword.password))) {
      throw new UnauthorizedException();
    }
    const payload = { sub: userPassword._id };
    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.NEST_JWT_SECRET,
      }),
    };
  }

  async register(
    userName: string,
    password: string
  ): Promise<{ access_token: string; password_id: string }> {
    const existingUser = await this.usersService.checkUsernameAvailability(userName);

    if (existingUser) {
      throw new HttpException('Username taken', 400);
    }

    const { _id } = await this.usersService.create({ password });
    const payload = { sub: _id };
    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.NEST_JWT_SECRET,
      }),
      password_id: _id.toString(),
    };
  }
}
