import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { UnpluginBuildContext, UnpluginContextMeta } from 'unplugin';
import type { ResolvedConfig } from 'vite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { NestBridgeOptions } from '../src/main';
import { nestBridgeUnplugin } from '../src/main';

const multiAppRoot = resolve(import.meta.dirname, 'fixtures/multi-app');
const meta: UnpluginContextMeta = { framework: 'vite', versions: {} };
const diagnostic = 'setGlobalPrefix(environment.globalPrefix)';

const buildContext: UnpluginBuildContext = {
  addWatchFile: () => {},
  emitFile: () => {},
  getWatchFiles: () => [],
  parse: () => undefined,
};

const warnings: string[] = [];

const bundlerLogger = {
  info: () => {},
  warn: (message: string) => warnings.push(message),
};

let outputDir: string;

const dynamic = (): NestBridgeOptions => ({
  name: 'dynamic',
  root: resolve(multiAppRoot, 'dynamic'),
  controllers: 'src/**/*.controller.ts',
  outputDir,
});

const viteConfig = (command: ResolvedConfig['command'], watch: object | null) => ({
  root: multiAppRoot,
  logger: bundlerLogger,
  command,
  build: { watch },
});

const startInVite = (config: ReturnType<typeof viteConfig>, pluginMeta = meta) => {
  const plugin = nestBridgeUnplugin.raw(dynamic(), pluginMeta);
  const configResolved = plugin.vite?.configResolved;
  const handler = typeof configResolved === 'function' ? configResolved : configResolved?.handler;
  Reflect.apply(handler ?? (() => {}), undefined, [config]);
  return () => plugin.buildStart?.call(buildContext);
};

const startInWebpack = (watchMode: boolean) => {
  const plugin = nestBridgeUnplugin.raw(dynamic(), { ...meta, framework: 'webpack' });
  const compiler = {
    options: { context: multiAppRoot },
    getInfrastructureLogger: () => bundlerLogger,
    watchMode: false,
  };
  Reflect.apply(plugin.webpack ?? (() => {}), undefined, [compiler]);
  compiler.watchMode = watchMode;
  return () => plugin.buildStart?.call(buildContext);
};

beforeEach(() => {
  outputDir = mkdtempSync(join(tmpdir(), 'nestbridge-watch-mode-'));
  warnings.length = 0;
});

afterEach(() => {
  rmSync(outputDir, { recursive: true, force: true });
});

describe('nestBridgeUnplugin watch mode detection', () => {
  it('fails a one-shot vite build', () => {
    expect(startInVite(viteConfig('build', null))).toThrow(diagnostic);
  });

  it('warns in vite build --watch', () => {
    expect(startInVite(viteConfig('build', {}))).not.toThrow();
    expect(warnings).toHaveLength(1);
  });

  it('warns in the vite dev server', () => {
    expect(startInVite(viteConfig('serve', null))).not.toThrow();
    expect(warnings).toHaveLength(1);
  });

  it('fails a one-shot webpack build', () => {
    expect(startInWebpack(false)).toThrow(diagnostic);
  });

  it('warns when webpack starts watching after the plugin is applied', () => {
    expect(startInWebpack(true)).not.toThrow();
    expect(warnings).toHaveLength(1);
  });

  it('lets the bundler meta decide when it reports watch mode', () => {
    expect(startInVite(viteConfig('build', null), { ...meta, watchMode: true })).not.toThrow();
    expect(warnings).toHaveLength(1);
  });
});
