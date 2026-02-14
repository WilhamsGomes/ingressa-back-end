import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma.service';

import { EventsRepository } from '../../domain/repositories/events.repository';
import { EventsEntity } from '../../domain/entities/events.entity';
import { CreateEventsDto } from '../../application/dto/create-events.dto';
import { UpdateEventsDto } from '../../application/dto/update-events.dto';
import { EventsMapper } from '../mappers/events.mapper';

// Inferindo tipos direto do PrismaService (sem @prisma/client Prisma/Event)
type PrismaModel = NonNullable<
  Awaited<ReturnType<PrismaService['event']['findUnique']>>
>;

@Injectable()
export class PrismaEventsRepository implements EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventsDto): Promise<EventsEntity> {
    const data = EventsMapper.toCreateInput(dto);

    const created: PrismaModel = await this.prisma.event.create({
      data,
    } as any);
    return EventsMapper.toEntity(created);
  }

  async findAll(): Promise<EventsEntity[]> {
    const results = await this.prisma.event.findMany();

    return results.map((r) => EventsMapper.toEntity(r as PrismaModel));
  }

  async findById(id: string): Promise<EventsEntity | null> {
    const result = await this.prisma.event.findUnique({ where: { id } });

    return result ? EventsMapper.toEntity(result as PrismaModel) : null;
  }

  async update(id: string, dto: UpdateEventsDto): Promise<EventsEntity> {
    const data = EventsMapper.toUpdateInput(dto);

    const updated = await this.prisma.event.update({
      where: { id },
      data,
    });

    return EventsMapper.toEntity(updated as PrismaModel);
  }

  async existsById(id: string): Promise<boolean> {
    const found = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });

    return !!found;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.event.delete({ where: { id } });
  }
}
