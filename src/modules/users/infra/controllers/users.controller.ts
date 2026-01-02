import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { CreateUserDto } from '../../application/dto/create-user.dto';
import { CreateUserUseCase } from '../../application/use-cases/create-user.usecase';
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id.usecase';
import { FindAllUseCase } from '../../application/use-cases/find-all.usecase';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly findAllUserUseCase: FindAllUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar usuário',
    description: 'Cria um novo usuário no sistema',
  })
  @ApiCreatedResponse({
    description: 'Usuário criado com sucesso',
    schema: {
      example: {
        id: 'cku123abc',
        name: 'João Silva',
        email: 'joao@email.com',
        createdAt: '2025-01-01T12:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos',
  })
  async create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna os dados de um usuário pelo seu ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário',
    example: 'cku123abc',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    schema: {
      example: {
        id: 'cku123abc',
        name: 'João Silva',
        email: 'joao@email.com',
        createdAt: '2025-01-01T12:00:00.000Z',
      },
    },
  })
  async findById(@Param('id') id: string) {
    return this.findUserByIdUseCase.execute(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Buscar todos usuário',
    description: 'Retorna os dados de todos usuários',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    schema: {
      example: {
        id: 'cku123abc',
        name: 'João Silva',
        email: 'joao@email.com',
        createdAt: '2025-01-01T12:00:00.000Z',
      },
    },
    isArray: true,
  })
  async findAll() {
    return await this.findAllUserUseCase.execute();
  }
}
