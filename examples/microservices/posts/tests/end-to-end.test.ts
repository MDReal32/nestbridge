import { type ChildProcess, spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createServer, type Socket } from 'node:net';
import { resolve } from 'node:path';
import { type ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const postsRoot = resolve(import.meta.dirname, '..');
const usersRoot = resolve(postsRoot, '../users');

const SERVICE_READY_MESSAGE = 'Nest microservice successfully started';

const FORBIDDEN_PATTERNS = [
  'UsersService',
  'Ada Lovelace',
  'postCount += 1',
  '@nestjs/platform-express',
];

const findFreePort = () =>
  new Promise<number>((resolvePort, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      probe.close(() => resolvePort(port));
    });
  });

const startService = (root: string, env: NodeJS.ProcessEnv) =>
  new Promise<ChildProcess>((resolveService, reject) => {
    const service = spawn(process.execPath, [resolve(root, 'dist/main.js')], {
      env: { ...process.env, ...env },
    });
    let output = '';

    service.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();

      if (output.includes(SERVICE_READY_MESSAGE)) {
        resolveService(service);
      }
    });
    service.once('error', reject);
    service.once('exit', (code) => reject(new Error(`${root} exited with ${code}:\n${output}`)));
  });

const createTcpClient = (port: number) =>
  ClientProxyFactory.create({ transport: Transport.TCP, options: { host: '127.0.0.1', port } });

/**
 * Waits for the server to acknowledge the close, so killing it afterwards cannot reset a half-closed
 * socket and make ClientTCP log ECONNRESET.
 */
const closeTcpClient = async (client: ClientProxy) => {
  const socket = client.unwrap<Socket>();
  const closed = once(socket, 'close');
  await client.close();
  await closed;
};

const services: ChildProcess[] = [];
let postsClient: ClientProxy;
let usersClient: ClientProxy;

beforeAll(async () => {
  for (const root of [usersRoot, postsRoot]) {
    await build({ root, configFile: resolve(root, 'vite.config.ts'), logLevel: 'silent' });
  }

  const usersPort = await findFreePort();
  const postsPort = await findFreePort();
  services.push(await startService(usersRoot, { USERS_PORT: String(usersPort) }));
  services.push(
    await startService(postsRoot, {
      POSTS_PORT: String(postsPort),
      USERS_PORT: String(usersPort),
    }),
  );

  usersClient = createTcpClient(usersPort);
  postsClient = createTcpClient(postsPort);
});

afterAll(async () => {
  await Promise.all([closeTcpClient(usersClient), closeTcpClient(postsClient)]);

  for (const service of services.reverse()) {
    const exited = once(service, 'exit');
    service.kill();
    await exited;
  }
});

describe('posts and users microservices end to end', () => {
  it('publishes a post after posts asks users for the author and emits an event to users', async () => {
    const published = await lastValueFrom(
      postsClient.send({ cmd: 'posts.publish' }, { authorId: '1', title: 'Notes on the engine' }),
    );

    expect(published).toEqual({
      id: '1',
      authorId: '1',
      title: 'Notes on the engine',
      authorName: 'Ada Lovelace',
    });
    await expect
      .poll(() => lastValueFrom(usersClient.send({ cmd: 'users.find-one' }, '1')))
      .toMatchObject({ postCount: 1 });
  });

  it('rejects a post whose author users does not know', async () => {
    await expect(
      lastValueFrom(postsClient.send({ cmd: 'posts.publish' }, { authorId: '9', title: 'Ghost' })),
    ).rejects.toEqual({ status: 'error', message: 'User "9" does not exist.' });
  });

  it('bundles the generated users client instead of the users implementation', () => {
    const bundle = readFileSync(resolve(postsRoot, 'dist/main.js'), 'utf-8');

    for (const forbidden of FORBIDDEN_PATTERNS) {
      expect(bundle).not.toContain(forbidden);
    }

    expect(bundle).toContain('users.find-one');
    expect(bundle).toContain('users.post-published');
  });
});
