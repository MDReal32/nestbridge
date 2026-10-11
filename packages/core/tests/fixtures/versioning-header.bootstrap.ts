import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const app = await NestFactory.create(AppModule);
app.enableVersioning({ type: VersioningType.HEADER, header: 'X-API-Version' });
await app.listen(3000);
