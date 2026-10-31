import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map } from 'rxjs';
import { AppModule } from './app.module';

@Injectable()
export class ShorthandInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((data) => ({ data, meta: { version: 1 } })));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ShorthandInterceptor());
  await app.listen(3000);
}

bootstrap();
