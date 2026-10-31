import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map, of } from 'rxjs';
import { AppModule } from './app.module';

@Injectable()
export class ForeignPipeSourceInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, _next: CallHandler) {
    return of(1).pipe(map((value) => ({ value })));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ForeignPipeSourceInterceptor());
  await app.listen(3000);
}

bootstrap();
