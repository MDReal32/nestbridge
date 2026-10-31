import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map, of } from 'rxjs';
import { AppModule } from './app.module';

@Injectable()
export class EarlyReturnInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    if (Math.random() > 0.5) {
      return of({ cached: true });
    }

    return next.handle().pipe(map((value) => ({ value })));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new EarlyReturnInterceptor());
  await app.listen(3000);
}

bootstrap();
