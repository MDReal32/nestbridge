import 'reflect-metadata';
import { type ClientOptions, ClientProxy, Transport } from '@nestjs/microservices';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  closeNestBridgeMicroservices,
  configureNestBridgeMicroservices,
  emitMessage,
  NestBridgeMicroserviceError,
  sendMessage,
} from '../src/microservices';

class StubClient extends ClientProxy {
  async connect() {
    return undefined;
  }

  async close() {
    return undefined;
  }

  unwrap<T>(): T {
    throw new Error('not used');
  }

  protected publish() {
    return () => undefined;
  }

  protected dispatchEvent() {
    return Promise.reject(new Error('not used'));
  }
}

afterEach(async () => {
  await closeNestBridgeMicroservices();
  configureNestBridgeMicroservices({});
});

describe('emitMessage', () => {
  it('emits through the configured client and resolves once the event is published', async () => {
    const client = new StubClient();
    const emit = vi.spyOn(client, 'emit').mockReturnValue(of(undefined));
    configureNestBridgeMicroservices({ clients: { notifications: client } });

    await expect(
      emitMessage({
        service: 'notifications',
        pattern: 'email.requested',
        payload: { recipient: 'user@example.com' },
      }),
    ).resolves.toBeUndefined();
    expect(emit).toHaveBeenCalledWith('email.requested', { recipient: 'user@example.com' });
  });
});

describe('sendMessage', () => {
  it('sends through the configured client and resolves with the last reply', async () => {
    const client = new StubClient();
    const send = vi.spyOn(client, 'send').mockReturnValue(of(1, 3));
    configureNestBridgeMicroservices({ clients: { notifications: client } });

    await expect(
      sendMessage({ service: 'notifications', pattern: { cmd: 'email.count' }, payload: {} }),
    ).resolves.toBe(3);
    expect(send).toHaveBeenCalledWith({ cmd: 'email.count' }, {});
  });
});

describe('configureNestBridgeMicroservices', () => {
  it('creates a client from defaultClient once per service and reuses it', async () => {
    const defaultClient = vi.fn<(service: string) => ClientOptions>((service) => ({
      transport: Transport.TCP,
      options: { host: `${service}.internal`, port: 4000 },
    }));
    configureNestBridgeMicroservices({ defaultClient });
    const emit = vi.spyOn(ClientProxy.prototype, 'emit').mockReturnValue(of(undefined));

    await emitMessage({ service: 'notifications', pattern: 'a', payload: {} });
    await emitMessage({ service: 'notifications', pattern: 'b', payload: {} });

    expect(defaultClient).toHaveBeenCalledTimes(1);
    expect(defaultClient).toHaveBeenCalledWith('notifications');
    expect(emit).toHaveBeenCalledTimes(2);
    emit.mockRestore();
  });

  it('prefers an entry in clients over defaultClient', async () => {
    const client = new StubClient();
    vi.spyOn(client, 'emit').mockReturnValue(of(undefined));
    const defaultClient = vi.fn();
    configureNestBridgeMicroservices({ clients: { notifications: client }, defaultClient });

    await emitMessage({ service: 'notifications', pattern: 'a', payload: {} });

    expect(defaultClient).not.toHaveBeenCalled();
  });

  it('fails with an error naming the service when no client is configured', async () => {
    const call = emitMessage({ service: 'billing', pattern: 'invoice.paid', payload: {} });

    await expect(call).rejects.toBeInstanceOf(NestBridgeMicroserviceError);
    await expect(call).rejects.toMatchObject({ service: 'billing' });
    await expect(call).rejects.toThrow(/"billing"/);
  });

  it('refuses to reconfigure while clients are in use', async () => {
    const client = new StubClient();
    vi.spyOn(client, 'emit').mockReturnValue(of(undefined));
    configureNestBridgeMicroservices({ clients: { notifications: client } });
    await emitMessage({ service: 'notifications', pattern: 'a', payload: {} });

    expect(() => configureNestBridgeMicroservices({})).toThrow(/already in use/);
  });
});

describe('closeNestBridgeMicroservices', () => {
  it('closes every client created so far', async () => {
    const client = new StubClient();
    vi.spyOn(client, 'emit').mockReturnValue(of(undefined));
    const close = vi.spyOn(client, 'close');
    configureNestBridgeMicroservices({ clients: { notifications: client } });
    await emitMessage({ service: 'notifications', pattern: 'a', payload: {} });

    await closeNestBridgeMicroservices();

    expect(close).toHaveBeenCalledTimes(1);
  });
});
