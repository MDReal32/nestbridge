import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureNestBridge, setNestBridgeBaseURL } from '../src/config';
import { graphqlRequest, NestBridgeGraphqlError } from '../src/graphql-adapter';

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });

beforeEach(() => {
  configureNestBridge({});
  setNestBridgeBaseURL(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('graphqlRequest', () => {
  it('sends the document and variables to baseURL + /graphql by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { user: { id: '1' } } }));
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({ fetch: fetchMock });

    await graphqlRequest({ document: 'query { user { id } }', variables: { id: '1' } });

    const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe('https://api.example.com/graphql');
    expect(JSON.parse(init.body as string)).toMatchObject({
      query: 'query { user { id } }',
      variables: { id: '1' },
    });
  });

  it('uses a configured graphqlEndpoint instead of baseURL + /graphql', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({
      graphqlEndpoint: 'https://api.example.com/gql',
      fetch: fetchMock,
    });

    await graphqlRequest({ document: 'query { ping }' });

    const [url] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe('https://api.example.com/gql');
  });

  it('resolves to the data returned by the server', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { user: { id: '1' } } }));
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({ fetch: fetchMock });

    const result = await graphqlRequest<{ user: { id: string } }>({
      document: 'query { user { id } }',
    });

    expect(result).toEqual({ user: { id: '1' } });
  });

  it('applies configured headers to the request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({
      headers: { authorization: 'Bearer token' },
      fetch: fetchMock,
    });

    await graphqlRequest({ document: 'query { ping }' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe('Bearer token');
  });

  it('throws a NestBridgeGraphqlError when the response contains GraphQL errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ errors: [{ message: 'Not Found' }] }));
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({ fetch: fetchMock });

    await expect(graphqlRequest({ document: 'query { missing }' })).rejects.toBeInstanceOf(
      NestBridgeGraphqlError,
    );
  });

  it('builds a readable message instead of dumping the raw response/request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ errors: [{ message: 'Not Found' }] }));
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({ fetch: fetchMock });

    const error = await graphqlRequest({ document: 'query { missing }' }).catch(
      (caught: unknown) => caught,
    );

    expect((error as NestBridgeGraphqlError).message).toBe(
      'NestBridge GraphQL request to https://api.example.com/graphql failed with status 200. Not Found',
    );
  });

  it('carries the GraphQL errors on NestBridgeGraphqlError', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ errors: [{ message: 'Not Found' }] }));
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({ fetch: fetchMock });

    const error = await graphqlRequest({ document: 'query { missing }' }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(NestBridgeGraphqlError);
    expect((error as NestBridgeGraphqlError).errors).toEqual([{ message: 'Not Found' }]);
  });

  it('resolves a relative graphqlEndpoint against globalThis.location when available', async () => {
    vi.stubGlobal('location', { origin: 'https://app.example.com' });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    configureNestBridge({ graphqlEndpoint: '/graphql', fetch: fetchMock });

    await graphqlRequest({ document: 'query { ping }' });

    const [url] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe('https://app.example.com/graphql');
  });

  it('uses a custom fetch implementation when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({ fetch: fetchMock });

    await graphqlRequest({ document: 'query { ping }' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
