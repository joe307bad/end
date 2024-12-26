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
    passwordId: string,
    pass: string
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(passwordId);

    if (!(await bcrypt.compare(pass, user.password))) {
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
