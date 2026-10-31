import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { UnpluginBuildContext, UnpluginContextMeta } from 'unplugin';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NestBridgeOptions } from '../src/main';
import { nestBridgeUnplugin } from '../src/main';

const fixtureRoot = resolve(import.meta.dirname, 'fixtures/message-patterns');
const notificationsRoot = resolve(fixtureRoot, 'notifications');
const unsupportedRoot = resolve(fixtureRoot, 'unsupported');
const outputDir = resolve(fixtureRoot, '.nestbridge-test-output');
const controllerFile = resolve(notificationsRoot, 'src/emails.controller.ts').replace(/\\/g, '/');
const declarationPath = resolve(outputDir, 'notifications-server/src/emails.controller.d.ts');

const meta: UnpluginContextMeta = { framework: 'vite', versions: {} };

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

const notifications = (overrides: Partial<NestBridgeOptions>): NestBridgeOptions => ({
  name: 'notifications',
  root: notificationsRoot,
  controllers: 'src/**/*.controller.ts',
  outputDir,
  ...overrides,
});

const unsupported = (overrides: Partial<NestBridgeOptions>): NestBridgeOptions => ({
  name: 'unsupported',
  root: unsupportedRoot,
  controllers: 'src/**/*.controller.ts',
  outputDir,
  ...overrides,
});

const transformController = (options: NestBridgeOptions) => {
  const plugin = nestBridgeUnplugin.raw(options, meta);
  plugin.buildStart?.call(buildContext);
  const hook = plugin.transform;
  const handler = typeof hook === 'function' ? hook : hook?.handler;
  return String(handler?.call(hookContext, '', controllerFile));
};

const buildOnce = (options: NestBridgeOptions) =>
  nestBridgeUnplugin.raw(options, { ...meta, watchMode: false });

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(outputDir, { recursive: true, force: true });
});

describe('nestBridgeUnplugin with messagePatterns', () => {
  it('turns message handlers into methods that publish to the app service', () => {
    const code = transformController(notifications({ messagePatterns: true }));

    expect(code).toContain("import { emitMessage, sendMessage } from 'nestbridge/microservices';");
    expect(code).toContain('pattern: "email.requested"');
    expect(code).toContain('pattern: {"cmd":"count"}');
    expect(code).toContain('service: "notifications"');
  });

  it('declares the message methods next to the HTTP routes', () => {
    transformController(notifications({ messagePatterns: true }));

    const declaration = readFileSync(declarationPath, 'utf-8');

    expect(declaration).toContain('find(...args:');
    expect(declaration).toContain(
      "handleEmailRequested(payload: Parameters<__ServerEmailsController['handleEmailRequested']>[0]): Promise<void>;",
    );
    expect(declaration).toContain(
      "count(): Promise<NestBridgeMessageResult<ReturnType<__ServerEmailsController['count']>>>;",
    );
  });

  it('shares the declarations with a second build that sets messagePatterns differently', () => {
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(fixtureRoot);
    transformController(notifications({ messagePatterns: true }));
    cwd.mockReturnValue(notificationsRoot);

    const otherBuild = buildOnce(notifications({}));

    expect(() => otherBuild.buildStart?.call(buildContext)).not.toThrow();
    expect(readFileSync(declarationPath, 'utf-8')).toContain('handleEmailRequested(payload:');
  });

  it('leaves message handlers out of the client code when messagePatterns is off', () => {
    const code = transformController(notifications({}));

    expect(code).not.toContain('nestbridge/microservices');
    expect(code).not.toContain('handleEmailRequested');
    expect(code).toContain('find(');
  });

  it('declares the message methods even when messagePatterns is off', () => {
    transformController(notifications({}));

    const declaration = readFileSync(declarationPath, 'utf-8');

    expect(declaration).toContain('handleEmailRequested(payload:');
    expect(declaration).toContain('count(): Promise<NestBridgeMessageResult');
  });

  it('writes the same declarations whatever messagePatterns is', () => {
    transformController(notifications({ messagePatterns: true }));
    const withMessagePatterns = readFileSync(declarationPath, 'utf-8');
    rmSync(outputDir, { recursive: true, force: true });

    transformController(notifications({}));

    expect(existsSync(declarationPath)).toBe(true);
    expect(readFileSync(declarationPath, 'utf-8')).toBe(withMessagePatterns);
  });
});

describe('nestBridgeUnplugin message pattern diagnostics', () => {
  it('fails a one-shot build on an unsupported message pattern when messagePatterns is on', () => {
    const plugin = buildOnce(unsupported({ messagePatterns: true }));

    expect(() => plugin.buildStart?.call(buildContext)).toThrow(/Unsupported message pattern/);
  });

  it('filters unsupported message pattern diagnostics out when messagePatterns is off', () => {
    const plugin = buildOnce(unsupported({}));

    expect(() => plugin.buildStart?.call(buildContext)).not.toThrow();
    expect(existsSync(resolve(outputDir, 'unsupported-server/src/audit.controller.d.ts'))).toBe(
      true,
    );
  });
});
