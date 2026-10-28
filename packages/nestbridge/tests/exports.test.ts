import { describe, expect, it } from 'vitest';
import {
  configureNestBridge,
  graphqlRequest,
  NestBridgeError,
  NestBridgeGraphqlError,
  request,
  setNestBridgeBaseURL,
  setNestBridgeServiceBaseURL,
} from '../src/index';
import {
  closeNestBridgeMicroservices,
  configureNestBridgeMicroservices,
  emitMessage,
  NestBridgeMicroserviceError,
  sendMessage,
} from '../src/microservices';
import nestBridge from '../src/vite';

describe('nestbridge root facade', () => {
  it('re-exports the runtime public API', () => {
    expect(configureNestBridge).toBeTypeOf('function');
    expect(request).toBeTypeOf('function');
    expect(NestBridgeError).toBeTypeOf('function');
  });

  it('re-exports the runtime GraphQL API', () => {
    expect(graphqlRequest).toBeTypeOf('function');
    expect(NestBridgeGraphqlError).toBeTypeOf('function');
  });
});

describe('nestbridge base URL API', () => {
  it('re-exports the global and per-service base URL setters the generated config module calls', () => {
    expect(setNestBridgeBaseURL).toBeTypeOf('function');
    expect(setNestBridgeServiceBaseURL).toBeTypeOf('function');
  });
});

describe('nestbridge/microservices facade', () => {
  it('re-exports the microservices runtime the generated message methods call', () => {
    expect(configureNestBridgeMicroservices).toBeTypeOf('function');
    expect(closeNestBridgeMicroservices).toBeTypeOf('function');
    expect(emitMessage).toBeTypeOf('function');
    expect(sendMessage).toBeTypeOf('function');
    expect(NestBridgeMicroserviceError).toBeTypeOf('function');
  });
});

describe('nestbridge/vite facade', () => {
  it('re-exports the Vite plugin as the default export', () => {
    expect(nestBridge).toBeTypeOf('function');
  });
});
