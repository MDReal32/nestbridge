import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './env';

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix(env.GLOBAL_PREFIX);
await app.listen(3000);
