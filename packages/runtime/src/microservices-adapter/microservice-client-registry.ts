import type { ClientProxy } from '@nestjs/microservices';
import type { NestBridgeMicroservicesConfig } from './nestbridge-microservices-config';

interface MicroserviceClientRegistry {
  config: NestBridgeMicroservicesConfig;
  clients: Map<string, ClientProxy>;
}

export const microserviceClientRegistry: MicroserviceClientRegistry = {
  config: {},
  clients: new Map(),
};
