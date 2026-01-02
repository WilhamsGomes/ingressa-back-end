import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { PrismaService } from 'src/shared/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Partial<User>[] | null> {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async update(userId: string, user: Partial<User>): Promise<User> {
    return await this.prisma.user.update({ where: { id: userId }, data: user });
  }

  async create(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
