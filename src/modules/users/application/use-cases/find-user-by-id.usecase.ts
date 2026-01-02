import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class FindUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
