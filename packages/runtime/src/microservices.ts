export type {
  NestBridgeMessage,
  NestBridgeMessageResult,
  NestBridgeMicroserviceClient,
  NestBridgeMicroservicesConfig,
} from './microservices-adapter';
export {
  closeNestBridgeMicroservices,
  configureNestBridgeMicroservices,
  emitMessage,
  NestBridgeMicroserviceError,
  sendMessage,
} from './microservices-adapter';
