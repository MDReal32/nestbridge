import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/identity', {
    exclude: [
      'health',
      { path: 'oidc/interaction/:uid', method: RequestMethod.GET },
      { path: 'oidc/interaction/:uid/login', method: RequestMethod.POST },
      { path: 'options-only', method: RequestMethod.OPTIONS },
      { path: 'every-method', method: RequestMethod.ALL },
    ],
  });
  await app.listen(3000);
}

bootstrap();
