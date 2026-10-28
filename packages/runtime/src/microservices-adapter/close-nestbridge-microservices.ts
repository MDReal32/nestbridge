import { microserviceClientRegistry } from './microservice-client-registry';

export const closeNestBridgeMicroservices = async (): Promise<void> => {
  const clients = [...microserviceClientRegistry.clients.values()];
  microserviceClientRegistry.clients.clear();
  await Promise.all(clients.map((client) => client.close()));
};
