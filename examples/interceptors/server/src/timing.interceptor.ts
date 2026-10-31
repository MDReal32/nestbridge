import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept<TValue>(_context: ExecutionContext, next: CallHandler<TValue>) {
    const startedAt = Date.now();

    return next.handle().pipe(map((value) => ({ value, tookMs: Date.now() - startedAt })));
  }
}
