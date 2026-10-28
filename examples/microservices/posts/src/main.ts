import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { configureNestBridgeMicroservices } from 'nestbridge/microservices';
import { AppModule } from './app.module';

const DEFAULT_PORT = 3602;
const DEFAULT_USERS_PORT = 3601;

configureNestBridgeMicroservices({
  clients: {
    users: {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: Number(process.env.USERS_PORT ?? DEFAULT_USERS_PORT),
      },
    },
  },
});

const bootstrap = async () => {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: Number(process.env.POSTS_PORT ?? DEFAULT_PORT),
    },
  });
  await app.listen();
};

void bootstrap();
