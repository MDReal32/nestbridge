import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { UnpluginBuildContext, UnpluginContextMeta } from 'unplugin';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NestBridgeOptions } from '../src/main';
import { nestBridgeUnplugin } from '../src/main';

const meta: UnpluginContextMeta = { framework: 'vite', versions: {}, watchMode: false };

const buildContext: UnpluginBuildContext = {
  addWatchFile: () => {},
  emitFile: () => {},
  getWatchFiles: () => [],
  parse: () => undefined,
};

const controllerSource = `import { Controller, Get } from '@nestjs/common';

@Controller('ping')
export class PingController {
  @Get()
  ping() {
    return 'pong';
  }
}
`;

const globalPrefixBootstrap = `import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map } from 'rxjs';
import { AppModule } from './app.module';

@Injectable()
class ResponseInterceptor {
  intercept(_context: unknown, next: { handle: () => { pipe: (operator: unknown) => unknown } }) {
    return next.handle().pipe(map((value: unknown) => ({ data: value })));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(3000);
}

bootstrap();
`;

let workspace: string;
let outputDir: string;

const writeServer = (directory: string, packageName: string | undefined) => {
  const root = join(workspace, directory);
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src/ping.controller.ts'), controllerSource);
  writeFileSync(join(root, 'main.ts'), 'export {};\n');
  writeFileSync(join(root, 'other.ts'), 'export {};\n');

  if (packageName !== undefined) {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: packageName }));
  }

  return root;
};

const buildAs = (clientDirectory: string, root: string, overrides: Partial<NestBridgeOptions>) => {
  const client = join(workspace, clientDirectory);
  mkdirSync(client, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(client);

  const plugin = nestBridgeUnplugin.raw(
    { root, controllers: 'src/**/*.controller.ts', outputDir, ...overrides },
    meta,
  );

  return () => plugin.buildStart?.call(buildContext);
};

beforeEach(() => {
  workspace = realpathSync(mkdtempSync(join(tmpdir(), 'nestbridge-sharing-')));
  outputDir = join(workspace, 'declarations');
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(workspace, { recursive: true, force: true });
});

describe('nestBridgeUnplugin declaration folders', () => {
  it('names the folder after the server package, whatever the app name is', () => {
    const server = writeServer('server', 'ping-server');

    buildAs('client', server, { name: 'renamed' })();

    expect(existsSync(join(outputDir, 'ping-server/src/ping.controller.d.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'renamed'))).toBe(false);
  });

  it('nests the declarations of a scoped package', () => {
    const server = writeServer('server', '@acme/api');

    buildAs('client', server, {})();

    expect(existsSync(join(outputDir, '@acme/api/src/ping.controller.d.ts'))).toBe(true);
  });

  it('fails the build when the server root has no package.json', () => {
    const server = writeServer('server', undefined);

    expect(buildAs('client', server, {})).toThrow(/package\.json has no "name"/);
    expect(existsSync(outputDir)).toBe(false);
  });

  it('fails the build when the server package has no name', () => {
    const server = writeServer('server', undefined);
    writeFileSync(join(server, 'package.json'), JSON.stringify({ version: '1.0.0' }));

    expect(buildAs('client', server, {})).toThrow(/package\.json has no "name"/);
  });
});

describe('nestBridgeUnplugin shared declarations', () => {
  it('lets clients of the same server write the same folder', () => {
    const server = writeServer('server', 'ping-server');
    const declarationPath = join(outputDir, 'ping-server/src/ping.controller.d.ts');

    buildAs('client-a', server, {})();
    const firstDeclaration = readFileSync(declarationPath, 'utf-8');

    expect(buildAs('client-b', server, { baseURL: 'https://example.com' })).not.toThrow();
    expect(readFileSync(declarationPath, 'utf-8')).toBe(firstDeclaration);
    expect(readdirSync(join(outputDir, 'ping-server')).sort()).toEqual(['src']);
  });

  it('lets the last build win when clients disagree on the bootstrap file', () => {
    const server = writeServer('server', 'ping-server');
    writeFileSync(join(server, 'other.ts'), globalPrefixBootstrap);
    const declarationPath = join(outputDir, 'ping-server/src/ping.controller.d.ts');

    buildAs('client-a', server, { bootstrap: 'main.ts' })();
    expect(readFileSync(declarationPath, 'utf-8')).not.toContain('__NestBridgeWrapped');

    expect(buildAs('client-b', server, { bootstrap: 'other.ts' })).not.toThrow();
    expect(readFileSync(declarationPath, 'utf-8')).toContain('__NestBridgeWrapped');
  });
});
