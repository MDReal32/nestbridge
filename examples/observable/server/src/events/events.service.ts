import { Injectable } from '@nestjs/common';
import { type Observable, of } from 'rxjs';
import type { EventDto } from './event.dto';

@Injectable()
export class EventsService {
  latest(id: string): Observable<EventDto> {
    return of({ id, message: `latest event for ${id}` });
  }
}
