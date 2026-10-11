import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configureNestBridge,
  setNestBridgeBaseURL,
  setNestBridgeServiceBaseURL,
} from '../src/config';
import { graphqlRequest } from '../src/graphql-adapter';
import { request } from '../src/http-adapter';

const okResponse = () => new Response(null, { status: 204 });
const graphqlResponse = () =>
  new Response(JSON.stringify({ data: {} }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const requestedUrl = (fetchMock: ReturnType<typeof vi.fn>) => {
  const [url] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
  return String(url);
};

beforeEach(() => {
  configureNestBridge({});
  setNestBridgeBaseURL(undefined);
  setNestBridgeServiceBaseURL('identity', undefined);
  setNestBridgeServiceBaseURL('store', undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('service base URLs', () => {
  it('sends each request to the origin registered for its service', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => okResponse());
    setNestBridgeServiceBaseURL('identity', 'https://identity.example.com');
    setNestBridgeServiceBaseURL('store', 'https://store.example.com');
    configureNestBridge({ fetch: fetchMock });

    await request({ method: 'GET', path: '/api/identity/users', service: 'identity' });
    await request({ method: 'GET', path: '/api/store/products', service: 'store' });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://identity.example.com/api/identity/users',
      'https://store.example.com/api/store/products',
    ]);
  });

  it('prefers a services entry from configureNestBridge over the registered origin', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    setNestBridgeServiceBaseURL('identity', 'https://identity.example.com');
    configureNestBridge({
      fetch: fetchMock,
      services: { identity: 'https://identity.staging.example.com' },
    });

    await request({ method: 'GET', path: '/users', service: 'identity' });

    expect(requestedUrl(fetchMock)).toBe('https://identity.staging.example.com/users');
  });

  it('falls back to the global base URL when the service has no origin', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({ fetch: fetchMock });

    await request({ method: 'GET', path: '/users', service: 'identity' });

    expect(requestedUrl(fetchMock)).toBe('https://api.example.com/users');
  });

  it('keeps a registered empty origin relative instead of using the global base URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    setNestBridgeBaseURL('https://api.example.com');
    setNestBridgeServiceBaseURL('identity', '');
    configureNestBridge({ fetch: fetchMock });

    await request({ method: 'GET', path: '/users', service: 'identity' });

    expect(requestedUrl(fetchMock)).toBe('/users');
  });

  it('ignores service origins for requests that name no service', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    setNestBridgeBaseURL('https://api.example.com');
    setNestBridgeServiceBaseURL('identity', 'https://identity.example.com');
    configureNestBridge({ fetch: fetchMock });

    await request({ method: 'GET', path: '/users' });

    expect(requestedUrl(fetchMock)).toBe('https://api.example.com/users');
  });

  it('forgets an origin once it is set to undefined', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    setNestBridgeServiceBaseURL('identity', 'https://identity.example.com');
    setNestBridgeServiceBaseURL('identity', undefined);
    configureNestBridge({ fetch: fetchMock });

    await request({ method: 'GET', path: '/users', service: 'identity' });

    expect(requestedUrl(fetchMock)).toBe('/users');
  });

  it('keeps registered origins when configureNestBridge is called again', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    setNestBridgeServiceBaseURL('identity', 'https://identity.example.com');
    configureNestBridge({ fetch: fetchMock });
    configureNestBridge({ fetch: fetchMock, headers: { authorization: 'Bearer token' } });

    await request({ method: 'GET', path: '/users', service: 'identity' });

    expect(requestedUrl(fetchMock)).toBe('https://identity.example.com/users');
  });
});

describe('service GraphQL endpoints', () => {
  it('posts to the /graphql endpoint of the origin registered for the service', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => graphqlResponse());
    setNestBridgeServiceBaseURL('identity', 'https://identity.example.com');
    setNestBridgeServiceBaseURL('store', 'https://store.example.com');
    configureNestBridge({ fetch: fetchMock });

    await graphqlRequest({ document: 'query { me { id } }', service: 'identity' });
    await graphqlRequest({ document: 'query { products { id } }', service: 'store' });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      'https://identity.example.com/graphql',
      'https://store.example.com/graphql',
    ]);
  });

  it('prefers a services entry from configureNestBridge', async () => {
    const fetchMock = vi.fn().mockResolvedValue(graphqlResponse());
    setNestBridgeServiceBaseURL('identity', 'https://identity.example.com');
    configureNestBridge({
      fetch: fetchMock,
      services: { identity: 'https://identity.staging.example.com' },
    });

    await graphqlRequest({ document: 'query { me { id } }', service: 'identity' });

    expect(requestedUrl(fetchMock)).toBe('https://identity.staging.example.com/graphql');
  });

  it('keeps an explicit graphqlEndpoint ahead of any service origin', async () => {
    const fetchMock = vi.fn().mockResolvedValue(graphqlResponse());
    setNestBridgeServiceBaseURL('identity', 'https://identity.example.com');
    configureNestBridge({
      fetch: fetchMock,
      graphqlEndpoint: 'https://gateway.example.com/gql',
    });

    await graphqlRequest({ document: 'query { me { id } }', service: 'identity' });

    expect(requestedUrl(fetchMock)).toBe('https://gateway.example.com/gql');
  });

  it('uses the graphqlEndpoint entry of the service when graphqlEndpoint is a map', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => graphqlResponse());
    setNestBridgeServiceBaseURL('identity', 'https://identity.example.com');
    setNestBridgeServiceBaseURL('store', 'https://store.example.com');
    configureNestBridge({
      fetch: fetchMock,
      graphqlEndpoint: { identity: 'https://identity.example.com/api/identity/graphql' },
    });

    await graphqlRequest({ document: 'query { me { id } }', service: 'identity' });
    await graphqlRequest({ document: 'query { products { id } }', service: 'store' });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      'https://identity.example.com/api/identity/graphql',
      'https://store.example.com/graphql',
    ]);
  });
});
