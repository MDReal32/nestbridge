import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NonObjectResponseExceptionFilter } from './filter-non-object-response.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new NonObjectResponseExceptionFilter());
  await app.listen(3000);
}

bootstrap();
