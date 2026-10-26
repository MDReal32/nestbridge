import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveOutputLocation } from '../src/plugin/resolve-output-location';

let workspace: string;
let client: string;

beforeEach(() => {
  workspace = realpathSync(mkdtempSync(join(tmpdir(), 'nestbridge-output-')));
  client = join(workspace, 'apps/web/client');
  mkdirSync(client, { recursive: true });
});

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true });
});

describe('resolveOutputLocation', () => {
  it('defaults to the workspace root and mirrors paths relative to it', () => {
    writeFileSync(join(workspace, 'nx.json'), '{}');

    const location = resolveOutputLocation({
      outputDir: undefined,
      name: undefined,
      root: client,
      bundlerRoot: client,
    });

    expect(location).toEqual({
      outputDir: join(workspace, '.nestbridge'),
      declarationDir: join(workspace, '.nestbridge'),
      errorBodyDir: join(workspace, '.nestbridge/apps/web/client'),
      mirrorRoot: workspace,
    });
  });

  it('keeps the workspace default per named app', () => {
    writeFileSync(join(workspace, 'nx.json'), '{}');

    const location = resolveOutputLocation({
      outputDir: undefined,
      name: 'identity',
      root: client,
      bundlerRoot: client,
    });

    expect(location.declarationDir).toBe(join(workspace, '.nestbridge/identity'));
    expect(location.errorBodyDir).toBe(join(workspace, '.nestbridge/apps/web/client/identity'));
  });

  it('falls back to the project root when no workspace is found', () => {
    const location = resolveOutputLocation({
      outputDir: undefined,
      name: undefined,
      root: client,
      bundlerRoot: client,
    });

    expect(location).toEqual({
      outputDir: join(client, '.nestbridge'),
      declarationDir: join(client, '.nestbridge'),
      errorBodyDir: join(client, '.nestbridge'),
      mirrorRoot: client,
    });
  });

  it('honours an explicit outputDir relative to the bundler root, even inside a workspace', () => {
    writeFileSync(join(workspace, 'nx.json'), '{}');

    const location = resolveOutputLocation({
      outputDir: 'generated',
      name: undefined,
      root: client,
      bundlerRoot: client,
    });

    expect(location).toEqual({
      outputDir: join(client, 'generated'),
      declarationDir: join(client, 'generated'),
      errorBodyDir: join(client, 'generated'),
      mirrorRoot: client,
    });
  });
});
