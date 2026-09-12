import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BranchingExceptionFilter } from './filter-branching-response.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new BranchingExceptionFilter());
  await app.listen(3000);
}

bootstrap();
