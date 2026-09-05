import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureNestBridge } from '../src/config';
import { request } from '../src/http-adapter';

const okResponse = () => new Response(null, { status: 204 });

beforeEach(() => {
  configureNestBridge({});
});

describe('configureNestBridge', () => {
  it('applies a static global headers object to every request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    configureNestBridge({ headers: { authorization: 'Bearer token' }, fetch: fetchMock });

    await request({ method: 'GET', path: '/users' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ authorization: 'Bearer token' });
  });

  it('resolves an async global headers function before each request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    configureNestBridge({
      headers: async () => ({ authorization: 'Bearer async-token' }),
      fetch: fetchMock,
    });

    await request({ method: 'GET', path: '/users' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ authorization: 'Bearer async-token' });
  });

  it('merges per-request headers on top of global headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    configureNestBridge({ headers: { authorization: 'Bearer token' }, fetch: fetchMock });

    await request({ method: 'GET', path: '/users', headers: { 'x-example': 'value' } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ authorization: 'Bearer token', 'x-example': 'value' });
  });

  it('ignores per-request headers explicitly set to undefined', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    configureNestBridge({ headers: { authorization: 'Bearer token' }, fetch: fetchMock });

    await request({ method: 'GET', path: '/users', headers: { authorization: undefined } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ authorization: 'Bearer token' });
  });

  it('prefixes every request path with baseURL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    configureNestBridge({ baseURL: 'https://api.example.com', fetch: fetchMock });

    await request({ method: 'GET', path: '/users' });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.example.com/users');
  });
});
