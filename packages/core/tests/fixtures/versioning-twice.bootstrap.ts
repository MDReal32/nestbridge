import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const app = await NestFactory.create(AppModule);
app.enableVersioning({ type: VersioningType.URI });
app.enableVersioning({ type: VersioningType.URI, prefix: 'x' });
await app.listen(3000);
