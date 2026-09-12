import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map, tap } from 'rxjs';
import { AppModule } from './app.module';

export class MultiOperatorInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap((_value) => {}),
      map((value) => ({ data: value })),
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new MultiOperatorInterceptor());
  await app.listen(3000);
}

bootstrap();
