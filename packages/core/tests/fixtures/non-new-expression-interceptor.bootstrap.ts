import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { existingInterceptor } from './existing-interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(existingInterceptor);
  await app.listen(3000);
}

bootstrap();
