export class EventsEntity {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  location?: string | null;
  totalTickets: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
