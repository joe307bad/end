import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { SharedModule } from '../shared/shared.module';
import { CodeModule } from '../code/code.module';

@Module({
  imports: [
    SharedModule,
    CodeModule,
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env.NEST_JWT_SECRET,
      signOptions: { expiresIn: '60000s' },
    }),
  ],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
