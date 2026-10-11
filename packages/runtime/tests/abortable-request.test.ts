import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureNestBridge, setNestBridgeBaseURL } from '../src/config';
import { graphqlRequest } from '../src/graphql-adapter';
import { isNestBridgeError, request } from '../src/http-adapter';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const fetchHonoringSignal = () =>
  vi.fn(
    (_url: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      }),
  );

const fetchIgnoringSignal = () => vi.fn(() => new Promise<Response>(() => undefined));

const settle = (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    (error: unknown) => error,
  );

beforeEach(() => {
  configureNestBridge({});
  setNestBridgeBaseURL(undefined);
});

describe('request abort', () => {
  it('returns a promise that carries an abort method', () => {
    configureNestBridge({ fetch: fetchHonoringSignal() });

    const pending = request({ method: 'GET', path: '/users' });
    pending.abort();

    expect(typeof pending.abort).toBe('function');
    return settle(pending);
  });

  it('hands fetch a signal that is not aborted while the call is in flight', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: '1' }));
    configureNestBridge({ fetch: fetchMock });

    await request({ method: 'GET', path: '/users/1' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.signal?.aborted).toBe(false);
  });

  it('rejects with an AbortError and aborts the fetch signal', async () => {
    const fetchMock = fetchHonoringSignal();
    configureNestBridge({ fetch: fetchMock });

    const pending = request({ method: 'GET', path: '/users' });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    pending.abort();

    const error = await settle(pending);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe('AbortError');
    expect(init.signal?.aborted).toBe(true);
  });

  it('rejects even when a custom fetch ignores the signal', async () => {
    configureNestBridge({ fetch: fetchIgnoringSignal() });

    const pending = request({ method: 'GET', path: '/users' });
    pending.abort();

    expect(((await settle(pending)) as DOMException).name).toBe('AbortError');
  });

  it('rejects with the reason passed to abort', async () => {
    configureNestBridge({ fetch: fetchHonoringSignal() });
    const reason = new Error('user navigated away');

    const pending = request({ method: 'GET', path: '/users' });
    pending.abort(reason);

    expect(await settle(pending)).toBe(reason);
  });

  it('does not report an abort as a NestBridgeError', async () => {
    configureNestBridge({ fetch: fetchHonoringSignal() });

    const pending = request({ method: 'GET', path: '/users' });
    pending.abort();

    expect(isNestBridgeError(await settle(pending))).toBe(false);
  });

  it('never calls fetch when aborted while the headers are still being resolved', async () => {
    const fetchMock = fetchIgnoringSignal();
    configureNestBridge({
      fetch: fetchMock,
      headers: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {};
      },
    });

    const pending = request({ method: 'GET', path: '/users' });
    pending.abort();

    expect(((await settle(pending)) as DOMException).name).toBe('AbortError');
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does nothing when aborted after the call has resolved', async () => {
    configureNestBridge({ fetch: vi.fn().mockResolvedValue(jsonResponse({ id: '1' })) });

    const pending = request<{ id: string }>({ method: 'GET', path: '/users/1' });
    const result = await pending;
    pending.abort();

    expect(result).toEqual({ id: '1' });
    await expect(pending).resolves.toEqual({ id: '1' });
  });

  it('keeps calls independent: aborting one does not abort another', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: '2' }));
    configureNestBridge({ fetch: fetchMock });

    const first = request({ method: 'GET', path: '/users/1' });
    const second = request({ method: 'GET', path: '/users/2' });
    first.abort();

    expect(await settle(first)).toBeInstanceOf(DOMException);
    await expect(second).resolves.toEqual({ id: '2' });
  });

  it('does not raise an unhandled rejection for a call aborted without being awaited', async () => {
    configureNestBridge({ fetch: fetchHonoringSignal() });
    const unhandledRejection = vi.fn();
    process.on('unhandledRejection', unhandledRejection);

    try {
      request({ method: 'GET', path: '/users' }).abort();
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(unhandledRejection).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandledRejection);
    }
  });
});

describe('graphqlRequest abort', () => {
  it('returns a promise that carries an abort method', () => {
    configureNestBridge({ fetch: fetchHonoringSignal() });

    const pending = graphqlRequest({ document: 'query { ping }' });
    pending.abort();

    expect(typeof pending.abort).toBe('function');
    return settle(pending);
  });

  it('rejects with an AbortError and aborts the fetch signal', async () => {
    const fetchMock = fetchHonoringSignal();
    configureNestBridge({ fetch: fetchMock });

    const pending = graphqlRequest({ document: 'query { ping }' });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    pending.abort();

    const error = await settle(pending);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect((error as DOMException).name).toBe('AbortError');
    expect(init.signal?.aborted).toBe(true);
  });

  it('rejects even when a custom fetch ignores the signal', async () => {
    configureNestBridge({ fetch: fetchIgnoringSignal() });

    const pending = graphqlRequest({ document: 'query { ping }' });
    pending.abort();

    expect(((await settle(pending)) as DOMException).name).toBe('AbortError');
  });

  it('never calls fetch when aborted while the headers are still being resolved', async () => {
    const fetchMock = fetchIgnoringSignal();
    configureNestBridge({
      fetch: fetchMock,
      headers: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {};
      },
    });

    const pending = graphqlRequest({ document: 'query { ping }' });
    pending.abort();

    await settle(pending);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves with the selected root field when `field` is given', async () => {
    configureNestBridge({
      fetch: vi.fn().mockResolvedValue(jsonResponse({ data: { user: { id: '1' } } })),
    });

    const result = await graphqlRequest<{ id: string }>({
      document: 'query { user { id } }',
      field: 'user',
    });

    expect(result).toEqual({ id: '1' });
  });
});
