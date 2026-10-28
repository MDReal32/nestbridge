import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { UnpluginBuildContext, UnpluginContextMeta } from 'unplugin';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NestBridgeOptions } from '../src/main';
import { nestBridgeUnplugin } from '../src/main';

const fixtureRoot = resolve(import.meta.dirname, 'fixtures/message-patterns');
const notificationsRoot = resolve(fixtureRoot, 'notifications');
const outputDir = resolve(fixtureRoot, '.nestbridge-test-output');
const controllerFile = resolve(notificationsRoot, 'src/emails.controller.ts').replace(/\\/g, '/');

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

const transformController = (options: NestBridgeOptions) => {
  const plugin = nestBridgeUnplugin.raw(options, meta);
  plugin.buildStart?.call(buildContext);
  const hook = plugin.transform;
  const handler = typeof hook === 'function' ? hook : hook?.handler;
  return String(handler?.call(hookContext, '', controllerFile));
};

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

    const declaration = readFileSync(
      resolve(outputDir, 'notifications/src/emails.controller.d.ts'),
      'utf-8',
    );

    expect(declaration).toContain('find(...args:');
    expect(declaration).toContain(
      "handleEmailRequested(payload: Parameters<__ServerEmailsController['handleEmailRequested']>[0]): Promise<void>;",
    );
    expect(declaration).toContain(
      "count(): Promise<NestBridgeMessageResult<ReturnType<__ServerEmailsController['count']>>>;",
    );
  });

  it('fails a second build that names the same app but configures it differently', () => {
    const declarationPath = resolve(outputDir, 'notifications/src/emails.controller.d.ts');
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(fixtureRoot);
    transformController(notifications({ messagePatterns: true }));
    cwd.mockReturnValue(notificationsRoot);

    const otherBuild = nestBridgeUnplugin.raw(notifications({}), { ...meta, watchMode: false });

    expect(() => otherBuild.buildStart?.call(buildContext)).toThrow(
      /App "notifications" shares its declarations in .+ with the build of .+, which configures it differently \(messagePatterns true there, false here\)\. .+give this app another `name`/,
    );
    expect(readFileSync(declarationPath, 'utf-8')).toContain('handleEmailRequested(payload:');
  });

  it('shares the declarations with a second build that configures the app the same way', () => {
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(fixtureRoot);
    transformController(notifications({ messagePatterns: true }));
    cwd.mockReturnValue(notificationsRoot);

    const otherBuild = nestBridgeUnplugin.raw(notifications({ messagePatterns: true }), {
      ...meta,
      watchMode: false,
    });

    expect(() => otherBuild.buildStart?.call(buildContext)).not.toThrow();
  });

  it('leaves message handlers out when messagePatterns is off', () => {
    const code = transformController(notifications({}));

    expect(code).not.toContain('nestbridge/microservices');
    expect(code).not.toContain('handleEmailRequested');
    expect(existsSync(resolve(outputDir, 'notifications/src/emails.controller.d.ts'))).toBe(true);
  });
});
