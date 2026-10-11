import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PUBLIC_ROUTES } from './public-routes';

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('api', { exclude: PUBLIC_ROUTES });
await app.listen(3000);
