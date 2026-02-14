import { EventsEntity } from '../entities/events.entity';
import { CreateEventsDto } from '../../application/dto/create-events.dto';
import { UpdateEventsDto } from '../../application/dto/update-events.dto';

export abstract class EventsRepository {
  abstract create(dto: CreateEventsDto): Promise<EventsEntity>;
  abstract findAll(): Promise<EventsEntity[]>;
  abstract findById(id: string): Promise<EventsEntity | null>;
  abstract update(id: string, dto: UpdateEventsDto): Promise<EventsEntity>;
  abstract existsById(id: string): Promise<boolean>;
  abstract delete(id: string): Promise<void>;
}
