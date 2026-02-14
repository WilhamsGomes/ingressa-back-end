import { PrismaService } from 'src/shared/database/prisma.service';
import { EventsEntity } from '../../domain/entities/events.entity';
import { CreateEventsDto } from '../../application/dto/create-events.dto';
import { UpdateEventsDto } from '../../application/dto/update-events.dto';

// Inferindo o tipo do Model direto do PrismaService (sem depender de @prisma/client exportar Event)
type PrismaModel = NonNullable<
  Awaited<ReturnType<PrismaService['event']['findUnique']>>
>;

type CreateArgs = Parameters<PrismaService['event']['create']>[0];
type CreateData = CreateArgs['data'];

type UpdateArgs = Parameters<PrismaService['event']['update']>[0];
type UpdateData = UpdateArgs['data'];

export class EventsMapper {
  static toEntity(model: PrismaModel): EventsEntity {
    return {
      id: model.id,
      title: model.title,
      description: model.description,
      date: model.date,
      location: model.location,
      totalTickets: model.totalTickets,
      createdById: model.createdById,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static toCreateInput(dto: CreateEventsDto): CreateData {
    // cria um objeto já no tipo esperado pelo prisma client real
    const data: any = { ...dto };

    if (data.date) data.date = new Date(data.date);

    return data as CreateData;
  }

  static toUpdateInput(dto: UpdateEventsDto): UpdateData {
    const data: any = { ...dto };

    if (data.date) data.date = new Date(data.date);

    return data as UpdateData;
  }
}
