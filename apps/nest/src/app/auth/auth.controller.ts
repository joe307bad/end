import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  signIn(@Body() signInDto: Record<string, string>) {
    return this.authService.signIn(signInDto.passwordId, signInDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('register')
  @Public()
  register(@Body() signInDto: Record<string, string>) {
    return this.authService.register(signInDto.userName, signInDto.password);
  }
}
