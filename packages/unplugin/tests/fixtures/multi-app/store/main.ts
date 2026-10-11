import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map } from 'rxjs';
import { AppModule } from './src/app.module';

@Injectable()
class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ data: value, meta: { requestId: 'generated' } })));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/store');
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(3002);
}

bootstrap();
