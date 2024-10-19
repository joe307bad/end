import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
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
    const user = await this.usersService.findOne(userName);

    if (!(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user._id, username: user.userName };
    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.NEST_JWT_SECRET,
      }),
    };
  }

  async register(
    userName: string,
    password: string
  ): Promise<{ access_token: string }> {
    const existingUser = await this.usersService.findOne(userName);

    if (existingUser) {
      throw new HttpException('Username taken', 400);
    }

    const { _id } = await this.usersService.create({ userName, password });
    const payload = { sub: _id, username: userName };
    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.NEST_JWT_SECRET,
      }),
    };
  }
}
