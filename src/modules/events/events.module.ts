import { Module } from '@nestjs/common';
import { EventsController } from './infra/controllers/events.controller';
import { EventsRepository } from './domain/repositories/events.repository';

import { PrismaEventsRepository } from './infra/prisma/prisma-events.repository';

import { CreateEventsUseCase } from './application/use-cases/create-events.usecase';
import { FindAllUseCase } from './application/use-cases/find-all.usecase';
import { FindEventsByIdUseCase } from './application/use-cases/find-events-by-id.usecase';
import { UpdateEventsUseCase } from './application/use-cases/update-events.usecase';
import { DeleteEventsUseCase } from './application/use-cases/delete-events.usecase';
import { PrismaService } from 'src/shared/database/prisma.service';

@Module({
  controllers: [EventsController],
  providers: [
    { provide: EventsRepository, useClass: PrismaEventsRepository },
    PrismaService,
    CreateEventsUseCase,
    FindAllUseCase,
    FindEventsByIdUseCase,
    UpdateEventsUseCase,
    DeleteEventsUseCase,
  ],
  exports: [{ provide: EventsRepository, useClass: PrismaEventsRepository }],
})
export class EventsModule {}
