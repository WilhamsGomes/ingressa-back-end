import { ConflictException, Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { PasswordService } from '../services/password.service';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
