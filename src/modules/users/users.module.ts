import { Module } from '@nestjs/common';
import { UsersController } from './infra/controllers/users.controller';
import { PrismaUserRepository } from './infra/prisma/prisma-user.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.usecase';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.usecase';
import { PasswordService } from './application/services/password.service';
import { UserRepository } from './domain/repositories/user.repository';
import { PrismaService } from 'src/shared/database/prisma.service';
import { FindAllUseCase } from './application/use-cases/find-all.usecase';

@Module({
  controllers: [UsersController],
  providers: [
    PrismaService,
    PasswordService,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    CreateUserUseCase,
    FindUserByIdUseCase,
    FindAllUseCase,
  ],
  exports: [UserRepository],
})
export class UsersModule {}
