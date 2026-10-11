import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/identity', { exclude: ['health'] });
  app.enableVersioning({ type: VersioningType.URI });
  await app.listen(3001);
}

bootstrap();
