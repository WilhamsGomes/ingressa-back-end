import { Module } from '@nestjs/common';
import { AuthController } from './infra/controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { TokenService } from './application/services/jwt.service';
import { PasswordService } from '../users/application/services/password.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [LoginUseCase, TokenService, PasswordService],
})
export class AuthModule {}
