import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map, tap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AppModule } from './app.module';

@Injectable()
export class MixedOperatorsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((first) => ({ first })),
      tap(() => {}),
      map((second) => ({ second, step: 2 })),
      finalize(() => {}),
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new MixedOperatorsInterceptor());
  await app.listen(3000);
}

bootstrap();
