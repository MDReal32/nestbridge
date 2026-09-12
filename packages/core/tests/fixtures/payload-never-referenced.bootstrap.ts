import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map } from 'rxjs';
import { AppModule } from './app.module';

export class StaticPayloadInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((_value) => ({ data: 'static', meta: { requestId: 'x' } })));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new StaticPayloadInterceptor());
  await app.listen(3000);
}

bootstrap();
