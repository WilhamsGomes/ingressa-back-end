import { Inject, Injectable } from '@nestjs/common';
import { EventsRepository } from '../../domain/repositories/events.repository';

@Injectable()
export class FindAllUseCase {
  constructor(
    @Inject(EventsRepository)
    private readonly repository: EventsRepository,
  ) {}

  async execute() {
    return this.repository.findAll();
  }
}
