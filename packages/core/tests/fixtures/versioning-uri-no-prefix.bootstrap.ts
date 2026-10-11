import { VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.URI,
  prefix: false,
  defaultVersion: VERSION_NEUTRAL,
});
await app.listen(3000);
