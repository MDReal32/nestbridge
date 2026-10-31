import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map } from 'rxjs';
import { AppModule } from './app.module';
import { tap } from './operators';

@Injectable()
export class LocalTapInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(() => {}),
      map((value) => ({ value })),
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LocalTapInterceptor());
  await app.listen(3000);
}

bootstrap();
