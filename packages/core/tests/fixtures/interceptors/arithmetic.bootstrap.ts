import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map } from 'rxjs';
import { AppModule } from './app.module';

@Injectable()
export class ArithmeticInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    const startedAt = Date.now();

    return next.handle().pipe(
      map((value) => ({
        value,
        tookMs: Date.now() - startedAt,
        doubled: 3 * 2,
        ratio: 4 / 2,
        remainder: 7 % 2,
      })),
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ArithmeticInterceptor());
  await app.listen(3000);
}

bootstrap();
