import { Inject, Injectable } from '@nestjs/common';
import { EventsRepository } from '../../domain/repositories/events.repository';
import { CreateEventsDto } from '../dto/create-events.dto';

@Injectable()
export class CreateEventsUseCase {
  constructor(
    @Inject(EventsRepository)
    private readonly repository: EventsRepository,
  ) {}

  async execute(dto: CreateEventsDto) {
    return this.repository.create(dto);
  }
}
