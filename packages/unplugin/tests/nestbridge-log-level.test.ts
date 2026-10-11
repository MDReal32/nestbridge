import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { UnpluginBuildContext, UnpluginContextMeta } from 'unplugin';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NestBridgeOptions } from '../src/main';
import { nestBridgeUnplugin } from '../src/main';

const multiAppRoot = resolve(import.meta.dirname, 'fixtures/multi-app');
const meta: UnpluginContextMeta = { framework: 'vite', versions: {} };

const buildContext: UnpluginBuildContext = {
  addWatchFile: () => {},
  emitFile: () => {},
  getWatchFiles: () => [],
  parse: () => undefined,
};

const messages = { info: [] as string[], warn: [] as string[] };

const bundlerLogger = {
  info: (message: string) => messages.info.push(message),
  warn: (message: string) => messages.warn.push(message),
};

let outputDir: string;

const dynamic = (overrides: Partial<NestBridgeOptions> = {}): NestBridgeOptions => ({
  name: 'dynamic',
  root: resolve(multiAppRoot, 'dynamic'),
  controllers: 'src/**/*.controller.ts',
  outputDir,
  ...overrides,
});

const identity = (overrides: Partial<NestBridgeOptions> = {}): NestBridgeOptions => ({
  name: 'identity',
  root: resolve(multiAppRoot, 'identity'),
  controllers: 'src/**/*.controller.ts',
  outputDir,
  ...overrides,
});

const identityCopy = (overrides: Partial<NestBridgeOptions> = {}): NestBridgeOptions =>
  identity({ name: 'identity-copy', ...overrides });

const startInVite = (options: NestBridgeOptions | NestBridgeOptions[]) => {
  const plugin = nestBridgeUnplugin.raw(options, meta);
  const configResolved = plugin.vite?.configResolved;
  const handler = typeof configResolved === 'function' ? configResolved : configResolved?.handler;
  Reflect.apply(handler ?? (() => {}), undefined, [{ root: multiAppRoot, logger: bundlerLogger }]);
  plugin.buildStart?.call(buildContext);
  return plugin;
};

beforeEach(() => {
  outputDir = mkdtempSync(join(tmpdir(), 'nestbridge-log-level-'));
  messages.info.length = 0;
  messages.warn.length = 0;
});

afterEach(() => {
  rmSync(outputDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('nestBridgeUnplugin log level', () => {
  it("reports warnings through Vite's logger so Vite's logLevel applies", () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    startInVite(dynamic());

    expect(messages.warn).toHaveLength(1);
    expect(messages.warn[0]).toContain('setGlobalPrefix(environment.globalPrefix)');
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('falls back to the console when the bundler provides no logger', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const plugin = nestBridgeUnplugin.raw(dynamic(), meta);

    plugin.buildStart?.call(buildContext);

    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn.mock.calls[0]?.[0]).toContain('setGlobalPrefix(environment.globalPrefix)');
  });

  it.each(['error', 'silent'] as const)('hides warnings at logLevel %s', (logLevel) => {
    startInVite(dynamic({ logLevel }));

    expect(messages.warn).toEqual([]);
  });

  it.each(['info', 'warn'] as const)('keeps warnings at logLevel %s', (logLevel) => {
    startInVite(dynamic({ logLevel }));

    expect(messages.warn).toHaveLength(1);
  });

  it('logs debug messages at the info level', () => {
    startInVite(dynamic({ debug: true }));

    expect(messages.info).toEqual([
      '[nestbridge] dynamic: analyzed 1 controller(s), 0 resolver(s), 1 diagnostic(s)',
    ]);
  });

  it.each(['warn', 'error', 'silent'] as const)(
    'hides debug messages at logLevel %s',
    (logLevel) => {
      startInVite(dynamic({ debug: true, logLevel }));

      expect(messages.info).toEqual([]);
    },
  );

  it('applies the level of each app to its own messages', () => {
    startInVite([
      dynamic({ logLevel: 'silent' }),
      identity({ name: 'identity', logLevel: 'info' }),
    ]);

    expect(messages.warn).toEqual([]);
  });

  it('does not hide a failing one-shot build', () => {
    const plugin = nestBridgeUnplugin.raw(dynamic({ logLevel: 'silent' }), {
      ...meta,
      watchMode: false,
    });

    expect(() => plugin.buildStart?.call(buildContext)).toThrow(
      'setGlobalPrefix(environment.globalPrefix)',
    );
  });

  it('warns about an overlapping file unless every app silences warnings', () => {
    startInVite([identity({ logLevel: 'silent' }), identityCopy({ logLevel: 'info' })]);

    expect(messages.warn).not.toEqual([]);
    expect(messages.warn.every((message) => message.includes('is matched by several apps'))).toBe(
      true,
    );
  });

  it('hides an overlapping file warning when every app silences warnings', () => {
    startInVite([identity({ logLevel: 'silent' }), identityCopy({ logLevel: 'error' })]);

    expect(messages.warn).toEqual([]);
  });

  it("reports warnings through webpack's infrastructure logger", () => {
    const plugin = nestBridgeUnplugin.raw(dynamic(), { ...meta, framework: 'webpack' });
    const getInfrastructureLogger = vi.fn(() => bundlerLogger);
    Reflect.apply(plugin.webpack ?? (() => {}), undefined, [
      { options: { context: multiAppRoot }, getInfrastructureLogger },
    ]);

    plugin.buildStart?.call(buildContext);

    expect(getInfrastructureLogger).toHaveBeenCalledWith('nestbridge');
    expect(messages.warn).toHaveLength(1);
  });
});
