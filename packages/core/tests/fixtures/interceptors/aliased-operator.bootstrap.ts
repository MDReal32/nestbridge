import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map as project } from 'rxjs';
import { AppModule } from './app.module';

@Injectable()
export class AliasedOperatorInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(project((value) => ({ value })));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new AliasedOperatorInterceptor());
  await app.listen(3000);
}

bootstrap();
