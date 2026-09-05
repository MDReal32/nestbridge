export type { NestBridgeConfig } from './config';
export { configureNestBridge } from './config';
export type { NestBridgeGraphqlRequest } from './graphql-adapter';
export { graphqlRequest, NestBridgeGraphqlError } from './graphql-adapter';
export type { NestBridgeRequest } from './http-adapter';
export { NestBridgeError, request } from './http-adapter';
export type { RemoteMethod, RemoteResult } from './remote-method';
export { VERSION } from './version';
