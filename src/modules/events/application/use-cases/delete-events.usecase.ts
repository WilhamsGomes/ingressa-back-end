import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventsRepository } from '../../domain/repositories/events.repository';

@Injectable()
export class DeleteEventsUseCase {
  constructor(
    @Inject(EventsRepository)
    private readonly repository: EventsRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const exists = await this.repository.existsById(id);
    if (!exists) throw new NotFoundException('Events not found');
    await this.repository.delete(id);
  }
}
