import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const app = await NestFactory.create(AppModule);

if (process.env.USE_PREFIX === 'true') {
  app.setGlobalPrefix('api');
}

await app.listen(3000);
