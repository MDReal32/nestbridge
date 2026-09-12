import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnsupportedPropertyExceptionFilter } from './filter-unsupported-property.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new UnsupportedPropertyExceptionFilter());
  await app.listen(3000);
}

bootstrap();
