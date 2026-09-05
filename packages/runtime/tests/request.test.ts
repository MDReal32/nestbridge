import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureNestBridge } from '../src/config';
import { NestBridgeError, request } from '../src/http-adapter';

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });

beforeEach(() => {
  configureNestBridge({});
});

describe('request', () => {
  it('performs a GET request against baseURL + path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: '1' }));
    configureNestBridge({ baseURL: '/api', fetch: fetchMock });

    const result = await request<{ id: string }>({ method: 'GET', path: '/users/1' });

    expect(result).toEqual({ id: '1' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/1',
      expect.objectContaining({ method: 'GET', body: undefined }),
    );
  });

  it('JSON-encodes the body and sets content-type for a POST request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: '1', name: 'MDReal' }));
    configureNestBridge({ fetch: fetchMock });

    await request({ method: 'POST', path: '/users', body: { name: 'MDReal' } });

    expect(fetchMock).toHaveBeenCalledWith(
      '/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'MDReal' }),
        headers: expect.objectContaining({ 'content-type': 'application/json' }),
      }),
    );
  });

  it('serializes query parameters, skipping undefined values', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    configureNestBridge({ fetch: fetchMock });

    await request({
      method: 'GET',
      path: '/users',
      query: { name: 'a', details: undefined, active: true },
    });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/users?name=a&active=true');
  });

  it('parses a JSON response body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: '1' }));
    configureNestBridge({ fetch: fetchMock });

    const result = await request<{ id: string }>({ method: 'GET', path: '/users/1' });

    expect(result).toEqual({ id: '1' });
  });

  it('resolves to undefined for an empty response body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    configureNestBridge({ fetch: fetchMock });

    const result = await request({ method: 'DELETE', path: '/users/1' });

    expect(result).toBeUndefined();
  });

  it('throws a NestBridgeError for a non-successful HTTP response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: 'Not Found' }, { status: 404 }));
    configureNestBridge({ fetch: fetchMock });

    await expect(request({ method: 'GET', path: '/users/missing' })).rejects.toBeInstanceOf(
      NestBridgeError,
    );
  });

  it('carries the status and parsed body on NestBridgeError', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: 'Not Found' }, { status: 404 }));
    configureNestBridge({ fetch: fetchMock });

    const error = await request({ method: 'GET', path: '/users/missing' }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(NestBridgeError);
    expect((error as NestBridgeError).status).toBe(404);
    expect((error as NestBridgeError).body).toEqual({ message: 'Not Found' });
  });

  it('includes the backend message in the error message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ statusCode: 404, message: 'User not found' }, { status: 404 }),
      );
    configureNestBridge({ fetch: fetchMock });

    const error = await request({ method: 'GET', path: '/users/missing' }).catch(
      (caught: unknown) => caught,
    );

    expect((error as NestBridgeError).message).toContain('User not found');
  });

  it('uses a custom fetch implementation when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    configureNestBridge({ fetch: fetchMock });

    await request({ method: 'GET', path: '/health' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
