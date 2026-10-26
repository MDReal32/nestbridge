import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findWorkspaceRoot } from '../src/discovery/find-workspace-root';

let sandbox: string;

beforeEach(() => {
  sandbox = realpathSync(mkdtempSync(join(tmpdir(), 'nestbridge-workspace-')));
  mkdirSync(join(sandbox, 'apps/web/client'), { recursive: true });
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe('findWorkspaceRoot', () => {
  it.each(['nx.json', 'pnpm-workspace.yaml', 'turbo.json', 'lerna.json'])(
    'finds the nearest ancestor containing %s',
    (marker) => {
      writeFileSync(join(sandbox, marker), '{}');

      expect(findWorkspaceRoot(join(sandbox, 'apps/web/client'))).toBe(sandbox);
    },
  );

  it('finds an ancestor whose package.json declares workspaces', () => {
    writeFileSync(join(sandbox, 'package.json'), JSON.stringify({ workspaces: ['apps/*/*'] }));

    expect(findWorkspaceRoot(join(sandbox, 'apps/web/client'))).toBe(sandbox);
  });

  it('ignores a package.json without workspaces', () => {
    writeFileSync(join(sandbox, 'package.json'), JSON.stringify({ name: 'solo' }));

    expect(findWorkspaceRoot(join(sandbox, 'apps/web/client'))).not.toBe(sandbox);
  });

  it('prefers the nearest workspace marker', () => {
    writeFileSync(join(sandbox, 'nx.json'), '{}');
    writeFileSync(join(sandbox, 'apps/web/turbo.json'), '{}');

    expect(findWorkspaceRoot(join(sandbox, 'apps/web/client'))).toBe(join(sandbox, 'apps/web'));
  });

  it('fails loudly on an unreadable package.json instead of skipping it', () => {
    writeFileSync(join(sandbox, 'apps/web/client/package.json'), '{ not json');

    expect(() => findWorkspaceRoot(join(sandbox, 'apps/web/client'))).toThrow();
  });
});
