import { lastValueFrom } from 'rxjs';
import { getMicroserviceClient } from './get-microservice-client';
import type { NestBridgeMessage } from './nestbridge-message';

export const sendMessage = <T>(message: NestBridgeMessage): Promise<T> => {
  const client = getMicroserviceClient(message.service);
  return lastValueFrom(client.send<T>(message.pattern, message.payload));
};
