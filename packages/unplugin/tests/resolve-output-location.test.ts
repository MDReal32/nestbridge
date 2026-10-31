import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveOutputLocation } from '../src/plugin/resolve-output-location';

let workspace: string;
let client: string;
let server: string;

const writeManifest = (directory: string, manifest: object) => {
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest));
};

beforeEach(() => {
  workspace = realpathSync(mkdtempSync(join(tmpdir(), 'nestbridge-output-')));
  client = join(workspace, 'apps/web/client');
  server = join(workspace, 'apps/web/server');
  mkdirSync(client, { recursive: true });
  writeManifest(server, { name: 'web-server' });
});

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true });
});

describe('resolveOutputLocation', () => {
  it('declares into a folder named after the server package under the workspace root', () => {
    writeFileSync(join(workspace, 'nx.json'), '{}');

    const location = resolveOutputLocation({
      outputDir: undefined,
      root: server,
      bundlerRoot: client,
    });

    expect(location).toEqual({
      outputDir: join(workspace, '.nestbridge'),
      declarationDir: join(workspace, '.nestbridge/web-server'),
    });
  });

  it('nests a scoped package name', () => {
    writeFileSync(join(workspace, 'nx.json'), '{}');
    writeManifest(server, { name: '@acme/api' });

    const location = resolveOutputLocation({
      outputDir: undefined,
      root: server,
      bundlerRoot: client,
    });

    expect(location.declarationDir).toBe(join(workspace, '.nestbridge/@acme/api'));
  });

  it('falls back to the project root when no workspace is found', () => {
    const location = resolveOutputLocation({
      outputDir: undefined,
      root: server,
      bundlerRoot: client,
    });

    expect(location).toEqual({
      outputDir: join(client, '.nestbridge'),
      declarationDir: join(client, '.nestbridge/web-server'),
    });
  });

  it('honours an explicit outputDir relative to the bundler root, even inside a workspace', () => {
    writeFileSync(join(workspace, 'nx.json'), '{}');

    const location = resolveOutputLocation({
      outputDir: 'generated',
      root: server,
      bundlerRoot: client,
    });

    expect(location).toEqual({
      outputDir: join(client, 'generated'),
      declarationDir: join(client, 'generated/web-server'),
    });
  });

  it('fails when the root has no package.json', () => {
    const bare = join(workspace, 'apps/bare');
    mkdirSync(bare, { recursive: true });

    expect(() =>
      resolveOutputLocation({ outputDir: undefined, root: bare, bundlerRoot: client }),
    ).toThrow(/bare[\\/]package\.json has no "name"/);
  });

  it('fails when the package.json has no name', () => {
    writeManifest(server, { version: '1.0.0' });

    expect(() =>
      resolveOutputLocation({ outputDir: undefined, root: server, bundlerRoot: client }),
    ).toThrow(/has no "name"/);
  });

  it('fails when the package name is empty', () => {
    writeManifest(server, { name: '' });

    expect(() =>
      resolveOutputLocation({ outputDir: undefined, root: server, bundlerRoot: client }),
    ).toThrow(/has no "name"/);
  });
});
