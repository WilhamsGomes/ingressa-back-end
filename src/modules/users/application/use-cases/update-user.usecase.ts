import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordService } from '../services/password.service';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(userId: string, dto: UpdateUserDto): Promise<any> {
    const { password } = dto;
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (password) {
      const hashedPassword = await this.passwordService.hash(dto?.password);
      dto = { ...dto, password: hashedPassword };
    }

    return await this.userRepository.update(userId, dto);
  }
}
