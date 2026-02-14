import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventsRepository } from '../../domain/repositories/events.repository';

@Injectable()
export class FindEventsByIdUseCase {
  constructor(
    @Inject(EventsRepository)
    private readonly repository: EventsRepository,
  ) {}

  async execute(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException('Events not found');
    return item;
  }
}
