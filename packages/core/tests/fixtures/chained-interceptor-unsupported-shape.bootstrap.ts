import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map, tap } from 'rxjs';
import { AppModule } from './app.module';

export class ValidChainedInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ data: value })));
  }
}

export class TapOnlyChainedInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(tap((_value) => {}));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ValidChainedInterceptor(), new TapOnlyChainedInterceptor());
  await app.listen(3000);
}

bootstrap();
