import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto } from '../../application/dto/login.dto';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { IsPublic } from 'src/shared/decorators/is-public';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @IsPublic()
  @Post('/login')
  create(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }
}
