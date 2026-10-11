import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './env';

const app = await NestFactory.create(AppModule);
app.enableVersioning({ type: VersioningType.URI, defaultVersion: env.DEFAULT_VERSION });
await app.listen(3000);
