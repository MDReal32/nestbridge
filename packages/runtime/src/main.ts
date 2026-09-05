export { version as VERSION } from '../package.json';
export type { NestBridgeConfig } from './config';
export { configureNestBridge } from './config';
export type { NestBridgeRequest } from './http-adapter';
export { NestBridgeError, request } from './http-adapter';
export type { RemoteMethod } from './remote-method';
