import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UndecoratedExceptionFilter } from './missing-catch-decorator.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new UndecoratedExceptionFilter());
  await app.listen(3000);
}

bootstrap();
