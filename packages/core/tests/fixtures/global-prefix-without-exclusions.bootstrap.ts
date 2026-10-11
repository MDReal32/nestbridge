import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('/api/admin-panel/');
await app.listen(3000);
