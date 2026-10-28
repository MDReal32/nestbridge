import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { UnpluginBuildContext, UnpluginContextMeta } from 'unplugin';
import type { ResolvedConfig } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';
import type { NestBridgeOptions } from '../src/main';
import { nestBridgeUnplugin } from '../src/main';
import { RESOLVED_CONFIG_VIRTUAL_MODULE_ID } from '../src/virtual-modules';

const multiAppRoot = resolve(import.meta.dirname, 'fixtures/multi-app');
const identityRoot = resolve(multiAppRoot, 'identity');
const storeRoot = resolve(multiAppRoot, 'store');
const outputDir = resolve(multiAppRoot, '.nestbridge-test-output');

const meta: UnpluginContextMeta = { framework: 'vite', versions: {} };
const buildMeta: UnpluginContextMeta = { ...meta, watchMode: false };

const buildContext: UnpluginBuildContext = {
  addWatchFile: () => {},
  emitFile: () => {},
  getWatchFiles: () => [],
  parse: () => undefined,
};

const hookContext = {
  ...buildContext,
  error: (message: unknown): never => {
    throw new Error(String(message));
  },
  warn: () => {},
};

const identity: NestBridgeOptions = {
  name: 'identity',
  root: identityRoot,
  controllers: 'src/**/*.controller.ts',
  baseURL: 'https://identity.example.com',
  outputDir,
};

const store: NestBridgeOptions = {
  name: 'store',
  root: storeRoot,
  controllers: 'src/**/*.controller.ts',
  baseURL: 'https://store.example.com',
  bootstrap: 'main.ts',
  outputDir,
};

const startPlugin = (options: NestBridgeOptions | NestBridgeOptions[]) => {
  const plugin = nestBridgeUnplugin.raw(options, meta);
  plugin.buildStart?.call(buildContext);
  return plugin;
};

const transformOf = (plugin: ReturnType<typeof startPlugin>, filePath: string) => {
  const hook = plugin.transform;
  const handler = typeof hook === 'function' ? hook : hook?.handler;
  return handler?.call(hookContext, '', filePath);
};

afterEach(() => {
  rmSync(outputDir, { recursive: true, force: true });
});

describe('nestBridgeUnplugin with several apps', () => {
  it('tags generated requests with the service of the app that owns the controller', () => {
    const plugin = startPlugin([identity, store]);

    const users = transformOf(plugin, resolve(identityRoot, 'src/users.controller.ts'));
    const products = transformOf(plugin, resolve(storeRoot, 'src/products.controller.ts'));

    expect(users).toContain('service: "identity"');
    expect(products).toContain('service: "store"');
  });

  it("composes each app's own global prefix and versioning into its routes", () => {
    const plugin = startPlugin([identity, store]);

    const users = transformOf(plugin, resolve(identityRoot, 'src/users.controller.ts'));
    const health = transformOf(plugin, resolve(identityRoot, 'src/health.controller.ts'));
    const products = transformOf(plugin, resolve(storeRoot, 'src/products.controller.ts'));

    expect(users).toContain('path: "/api/identity/v1/users/" + encodeURIComponent(id)');
    expect(health).toContain('path: "/health"');
    expect(products).toContain('path: "/api/store/products"');
  });

  it('registers one origin per service in the shared config module', () => {
    const plugin = startPlugin([identity, store]);

    const load = plugin.load;
    const handler = typeof load === 'function' ? load : load?.handler;
    const code = handler?.call(hookContext, RESOLVED_CONFIG_VIRTUAL_MODULE_ID);

    expect(code).toContain(
      'setNestBridgeServiceBaseURL("identity", "https://identity.example.com");',
    );
    expect(code).toContain('setNestBridgeServiceBaseURL("store", "https://store.example.com");');
  });

  it('writes declarations under a folder per app', () => {
    startPlugin([identity, store]);

    expect(existsSync(resolve(outputDir, 'identity/src/users.controller.d.ts'))).toBe(true);
    expect(existsSync(resolve(outputDir, 'store/src/products.controller.d.ts'))).toBe(true);
  });

  it('detects the response wrapper of each bootstrap file independently', () => {
    startPlugin([identity, store]);

    const identityDeclaration = readFileSync(
      resolve(outputDir, 'identity/src/users.controller.d.ts'),
      'utf-8',
    );
    const storeDeclaration = readFileSync(
      resolve(outputDir, 'store/src/products.controller.d.ts'),
      'utf-8',
    );

    expect(identityDeclaration).not.toContain('__NestBridgeWrapped');
    expect(storeDeclaration).toContain('__NestBridgeWrapped');
  });

  it('lets an explicit globalPrefix and versioning replace what the bootstrap file says', () => {
    const plugin = startPlugin([
      { ...identity, globalPrefix: 'gateway', versioning: { prefix: 'ver' } },
      store,
    ]);

    const users = transformOf(plugin, resolve(identityRoot, 'src/users.controller.ts'));

    expect(users).toContain('path: "/gateway/ver1/users/" + encodeURIComponent(id)');
  });

  it('lets false ignore the global prefix and versioning of the bootstrap file', () => {
    const plugin = startPlugin([{ ...identity, globalPrefix: false, versioning: false }, store]);

    const users = transformOf(plugin, resolve(identityRoot, 'src/users.controller.ts'));

    expect(users).toContain('path: "/users/" + encodeURIComponent(id)');
  });

  it('leaves files that belong to no app untouched', () => {
    const plugin = startPlugin([identity, store]);

    expect(transformOf(plugin, resolve(identityRoot, 'main.ts'))).toBeNull();
  });

  it('keeps an unnamed single app working without a service tag', () => {
    const plugin = startPlugin({ ...identity, name: undefined });

    const users = transformOf(plugin, resolve(identityRoot, 'src/users.controller.ts'));

    expect(users).not.toContain('service:');
    expect(existsSync(resolve(outputDir, 'src/users.controller.d.ts'))).toBe(true);
  });

  it('fails the build when two apps match the same controller file', () => {
    const plugin = nestBridgeUnplugin.raw(
      [identity, { ...identity, name: 'identity-copy' }],
      buildMeta,
    );

    expect(() => plugin.buildStart?.call(buildContext)).toThrow(
      'is matched by several apps ("identity", "identity-copy")',
    );
  });

  it('fails the build when an explicit bootstrap file does not exist', () => {
    const plugin = nestBridgeUnplugin.raw({ ...identity, bootstrap: 'missing.ts' }, buildMeta);

    expect(() => plugin.buildStart?.call(buildContext)).toThrow(
      'Bootstrap file of app "identity" not found',
    );
  });
});

describe('nestBridgeUnplugin bootstrap detection per app', () => {
  const dynamic: NestBridgeOptions = {
    name: 'dynamic',
    root: resolve(multiAppRoot, 'dynamic'),
    controllers: 'src/**/*.controller.ts',
    outputDir,
  };

  it('fails the build when the global prefix cannot be read from the bootstrap file', () => {
    const plugin = nestBridgeUnplugin.raw(dynamic, buildMeta);

    expect(() => plugin.buildStart?.call(buildContext)).toThrow(
      'setGlobalPrefix(environment.globalPrefix)',
    );
  });

  it('accepts an explicit globalPrefix instead of the unreadable one', () => {
    const plugin = startPlugin({ ...dynamic, globalPrefix: 'api/dynamic' });

    const ping = transformOf(plugin, resolve(multiAppRoot, 'dynamic/src/ping.controller.ts'));

    expect(ping).toContain('path: "/api/dynamic/ping"');
  });

  it('accepts false to ignore the unreadable global prefix', () => {
    const plugin = startPlugin({ ...dynamic, globalPrefix: false });

    const ping = transformOf(plugin, resolve(multiAppRoot, 'dynamic/src/ping.controller.ts'));

    expect(ping).toContain('path: "/ping"');
  });
});

describe('nestBridgeUnplugin roots', () => {
  it('resolves a relative root against the Vite root', () => {
    const plugin = nestBridgeUnplugin.raw(
      [
        { ...identity, root: 'identity' },
        { ...store, root: 'store' },
      ],
      meta,
    );
    const configResolved = plugin.vite?.configResolved;
    const handler = typeof configResolved === 'function' ? configResolved : configResolved?.handler;
    Reflect.apply(handler ?? (() => {}), undefined, [
      { root: multiAppRoot, command: 'serve', build: { watch: null } } as ResolvedConfig,
    ]);

    plugin.buildStart?.call(buildContext);

    const users = transformOf(plugin, resolve(identityRoot, 'src/users.controller.ts'));
    expect(users).toContain('service: "identity"');
  });
});

describe('nestBridgeUnplugin watching several apps', () => {
  let workingCopy: string | undefined;

  afterEach(() => {
    if (workingCopy !== undefined) {
      rmSync(workingCopy, { recursive: true, force: true });
      workingCopy = undefined;
    }
  });

  it('re-analyzes only the app whose bootstrap file changed', () => {
    workingCopy = mkdtempSync(join(tmpdir(), 'nestbridge-multi-app-'));
    cpSync(multiAppRoot, workingCopy, { recursive: true });
    const copiedIdentity = join(workingCopy, 'identity');
    const copiedStore = join(workingCopy, 'store');
    const plugin = startPlugin([
      { ...identity, root: copiedIdentity, outputDir: join(workingCopy, 'out') },
      { ...store, root: copiedStore, outputDir: join(workingCopy, 'out') },
    ]);
    const storeMain = join(copiedStore, 'main.ts');
    const productsController = join(copiedStore, 'src/products.controller.ts');
    const usersController = join(copiedIdentity, 'src/users.controller.ts');

    writeFileSync(
      storeMain,
      readFileSync(storeMain, 'utf-8').replace("'api/store'", "'api/shop'"),
      'utf-8',
    );
    plugin.watchChange?.call(buildContext, storeMain, { event: 'update' });

    expect(transformOf(plugin, productsController)).toContain('path: "/api/shop/products"');
    expect(transformOf(plugin, usersController)).toContain('/api/identity/v1/users/');
  });
});
