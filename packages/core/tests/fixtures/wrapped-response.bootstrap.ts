import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WrappedResponseInterceptor } from './wrapped-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new WrappedResponseInterceptor());
  await app.listen(3000);
}

bootstrap();
