import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventsRepository } from '../../domain/repositories/events.repository';
import { UpdateEventsDto } from '../dto/update-events.dto';

@Injectable()
export class UpdateEventsUseCase {
  constructor(
    @Inject(EventsRepository)
    private readonly repository: EventsRepository,
  ) {}

  async execute(id: string, dto: UpdateEventsDto) {
    const exists = await this.repository.existsById(id);
    if (!exists) throw new NotFoundException('Events not found');


    return this.repository.update(id, dto);
  }
}
