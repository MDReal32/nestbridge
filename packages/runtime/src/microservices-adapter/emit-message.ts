import { lastValueFrom } from 'rxjs';
import { getMicroserviceClient } from './get-microservice-client';
import type { NestBridgeMessage } from './nestbridge-message';

export const emitMessage = async (message: NestBridgeMessage): Promise<void> => {
  const client = getMicroserviceClient(message.service);
  await lastValueFrom(client.emit(message.pattern, message.payload), { defaultValue: undefined });
};
