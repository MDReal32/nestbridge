import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BootstrapInterceptor } from './wrapping.interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new BootstrapInterceptor());
  await app.listen(3000);
}

bootstrap();
