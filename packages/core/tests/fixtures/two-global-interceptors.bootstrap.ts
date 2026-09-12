import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirstInterceptor } from './first.interceptor';
import { SecondInterceptor } from './second.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new FirstInterceptor());
  app.useGlobalInterceptors(new SecondInterceptor());
  await app.listen(3000);
}

bootstrap();
