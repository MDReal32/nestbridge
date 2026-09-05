import { describe, expect, it } from 'vitest';
import {
  configureNestBridge,
  graphqlRequest,
  NestBridgeError,
  NestBridgeGraphqlError,
  request,
} from '../src/index';
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

describe('nestbridge/vite facade', () => {
  it('re-exports the Vite plugin as the default export', () => {
    expect(nestBridge).toBeTypeOf('function');
  });
});
