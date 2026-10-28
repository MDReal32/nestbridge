import { microserviceClientRegistry } from './microservice-client-registry';
import type { NestBridgeMicroservicesConfig } from './nestbridge-microservices-config';

export const configureNestBridgeMicroservices = (config: NestBridgeMicroservicesConfig): void => {
  if (microserviceClientRegistry.clients.size > 0) {
    throw new Error(
      'NestBridge microservice clients are already in use. Call closeNestBridgeMicroservices() before configuring again.',
    );
  }

  microserviceClientRegistry.config = config;
};
