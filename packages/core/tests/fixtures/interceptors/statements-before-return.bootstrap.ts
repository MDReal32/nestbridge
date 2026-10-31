import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map } from 'rxjs';
import { AppModule } from './app.module';

@Injectable()
export class LoggingEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    const logger = new Logger(LoggingEnvelopeInterceptor.name);
    const startedAt = Date.now();
    logger.log('intercepting');

    const piped = next.handle().pipe(map((value) => ({ value, tookMs: Date.now() - startedAt })));

    return piped;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingEnvelopeInterceptor());
  await app.listen(3000);
}

bootstrap();
