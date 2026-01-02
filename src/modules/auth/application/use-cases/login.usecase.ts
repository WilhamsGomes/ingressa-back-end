import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { PasswordService } from '../../../users/application/services/password.service';
import { LoginDto } from '../dto/login.dto';
import { Auth } from '../../domain/entities/login.entity';
import { TokenService } from '../services/jwt.service';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginDto): Promise<Auth | null> {
    const { email, password } = dto;

    const user = await this.userRepository.findByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await this.passwordService.compare(
      password,
      user.password,
    );

    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.tokenService.generateAccessToken(user.id);

    return {
      accessToken,
    };
  }
}
