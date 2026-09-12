import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { existingFilter } from './existing-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(existingFilter);
  await app.listen(3000);
}

bootstrap();
