import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept<TData>(_context: ExecutionContext, next: CallHandler<TData>) {
    return next.handle().pipe(map((value) => ({ data: value, meta: { requestId: 'generated' } })));
  }
}
