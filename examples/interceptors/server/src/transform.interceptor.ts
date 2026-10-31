import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs';
import type { Envelope } from './envelope';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>) {
    return next.handle().pipe(map((data) => ({ data, meta: { version: 1 } })));
  }
}
