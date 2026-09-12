import { NestFactory } from '@nestjs/core';
import { FirstExceptionFilter } from './conflicting-filter-registrations.first.filter';
import { AppModule } from './conflicting-filter-registrations.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new FirstExceptionFilter());
  await app.listen(3000);
}

bootstrap();
