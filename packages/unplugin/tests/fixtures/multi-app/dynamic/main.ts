import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { environment } from './src/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(environment.globalPrefix);
  await app.listen(3003);
}

bootstrap();
