import { Controller, Get, UseInterceptors } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { createInterceptor } from './create-interceptor';

@Controller('streaming')
export class StreamingInterceptorController {
  @Get()
  @UseInterceptors(createInterceptor())
  watch(): Observable<number> {
    throw new Error('not implemented');
  }
}
