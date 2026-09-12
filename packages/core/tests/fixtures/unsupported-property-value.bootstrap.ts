import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map } from 'rxjs';
import { AppModule } from './app.module';

export class TimestampedInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next
      .handle()
      .pipe(map((value) => ({ data: value, meta: { timestamp: new Date().toISOString() } })));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new TimestampedInterceptor());
  await app.listen(3000);
}

bootstrap();
