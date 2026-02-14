import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CreateEventsDto } from '../../application/dto/create-events.dto';
import { UpdateEventsDto } from '../../application/dto/update-events.dto';

import { CreateEventsUseCase } from '../../application/use-cases/create-events.usecase';
import { FindAllUseCase } from '../../application/use-cases/find-all.usecase';
import { FindEventsByIdUseCase } from '../../application/use-cases/find-events-by-id.usecase';
import { UpdateEventsUseCase } from '../../application/use-cases/update-events.usecase';
import { DeleteEventsUseCase } from '../../application/use-cases/delete-events.usecase';
import { CurrentUserId } from 'src/shared/decorators/current-user.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly createUseCase: CreateEventsUseCase,
    private readonly findAllUseCase: FindAllUseCase,
    private readonly findByIdUseCase: FindEventsByIdUseCase,
    private readonly updateUseCase: UpdateEventsUseCase,
    private readonly deleteUseCase: DeleteEventsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create Events' })
  @ApiBody({ type: CreateEventsDto })
  @ApiCreatedResponse({ description: 'Created successfully' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async create(@Body() dto: CreateEventsDto, @CurrentUserId() user: string) {
    return this.createUseCase.execute({ ...dto, createdById: user });
  }

  @Get()
  @ApiOperation({ summary: 'List events' })
  @ApiOkResponse({ description: 'List returned successfully' })
  async findAll() {
    return this.findAllUseCase.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Events by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Found successfully' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findById(@Param('id') id: string) {
    return this.findByIdUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Events' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateEventsDto })
  @ApiOkResponse({ description: 'Updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateEventsDto) {
    return this.updateUseCase.execute(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Events' })
  @ApiParam({ name: 'id', type: String })
  @ApiNoContentResponse({ description: 'Deleted successfully' })
  @ApiNotFoundResponse({ description: 'Not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
