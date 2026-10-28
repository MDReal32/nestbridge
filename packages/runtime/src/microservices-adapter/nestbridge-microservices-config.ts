import type { ClientOptions } from '@nestjs/microservices';
import type { NestBridgeMicroserviceClient } from './nestbridge-microservice-client';

export interface NestBridgeMicroservicesConfig {
  /**
   * Clients keyed by the `name` of a server app in the plugin options: either options for
   * `ClientProxyFactory.create()` or a ready `ClientProxy`.
   */
  clients?: Record<string, NestBridgeMicroserviceClient>;
  /**
   * Builds the client options of every service without an entry in `clients`.
   */
  defaultClient?: (service: string) => ClientOptions;
}
