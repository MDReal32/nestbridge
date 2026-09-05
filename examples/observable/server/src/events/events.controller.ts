import { Controller, Get, Inject, Param } from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { EventDto } from './event.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(@Inject(EventsService) private readonly eventsService: EventsService) {}

  @Get(':id/latest')
  latest(@Param('id') id: string): Observable<EventDto> {
    return this.eventsService.latest(id);
  }
}
