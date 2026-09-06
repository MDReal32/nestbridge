import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureNestBridge, setNestBridgeBaseURL } from '../src/config';
import { request } from '../src/http-adapter';

const okResponse = () => new Response(null, { status: 204 });

afterEach(() => {
  configureNestBridge({});
  setNestBridgeBaseURL(undefined);
});

describe('setNestBridgeBaseURL', () => {
  it('prefixes every request path with the configured baseURL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({ fetch: fetchMock });

    await request({ method: 'GET', path: '/users' });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.example.com/users');
  });

  it('survives a later configureNestBridge call that only changes headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    setNestBridgeBaseURL('https://api.example.com');
    configureNestBridge({ fetch: fetchMock });
    configureNestBridge({ fetch: fetchMock, headers: { authorization: 'Bearer token' } });

    await request({ method: 'GET', path: '/users' });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.example.com/users');
  });
});
