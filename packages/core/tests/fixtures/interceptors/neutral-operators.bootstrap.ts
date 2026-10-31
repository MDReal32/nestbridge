import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { finalize, tap, timeout } from 'rxjs';
import { AppModule } from './app.module';

@Injectable()
export class NeutralOperatorsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(() => {}),
      timeout(1000),
      finalize(() => {}),
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new NeutralOperatorsInterceptor());
  await app.listen(3000);
}

bootstrap();
