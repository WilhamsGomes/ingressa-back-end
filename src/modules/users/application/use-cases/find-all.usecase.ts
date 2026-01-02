import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class FindAllUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<Partial<User>[]> {
    return await this.userRepository.findAll();
  }
}
