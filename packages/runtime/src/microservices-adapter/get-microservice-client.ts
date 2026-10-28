import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { microserviceClientRegistry } from './microservice-client-registry';
import { NestBridgeMicroserviceError } from './nestbridge-microservice-error';

const resolveClientConfig = (service: string) => {
  const { clients, defaultClient } = microserviceClientRegistry.config;
  const config = clients?.[service] ?? defaultClient?.(service);

  if (config === undefined) {
    throw new NestBridgeMicroserviceError(
      `No microservice client is configured for service "${service}". Add it to \`clients\` or provide \`defaultClient\` in configureNestBridgeMicroservices().`,
      service,
    );
  }

  return config;
};

export const getMicroserviceClient = (service: string) => {
  const existing = microserviceClientRegistry.clients.get(service);

  if (existing !== undefined) {
    return existing;
  }

  const config = resolveClientConfig(service);
  const client = config instanceof ClientProxy ? config : ClientProxyFactory.create(config);
  microserviceClientRegistry.clients.set(service, client);
  return client;
};
