import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${route} handled in ${Date.now() - startedAt}ms`);
      }),
    );
  }
}
