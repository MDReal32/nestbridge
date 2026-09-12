import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EndResponseExceptionFilter } from './filter-non-json-response.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new EndResponseExceptionFilter());
  await app.listen(3000);
}

bootstrap();
