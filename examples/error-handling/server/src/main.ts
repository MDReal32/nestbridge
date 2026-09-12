import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception.filter';
import { ResponseInterceptor } from './response.interceptor';
import { Response2Interceptor } from './response2.interceptor';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalInterceptors(new ResponseInterceptor(), new Response2Interceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3500);
};

void bootstrap();
