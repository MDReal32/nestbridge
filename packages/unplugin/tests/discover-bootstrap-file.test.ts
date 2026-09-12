import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverBootstrapFile } from '../src/discovery';

const fixture = (name: string) =>
  resolve(import.meta.dirname, 'fixtures/bootstrap-discovery', name);

describe('discoverBootstrapFile', () => {
  it('returns the sole main.ts match under the given root', () => {
    const root = fixture('single-match');

    expect(discoverBootstrapFile(root, resolve(root, '.nestbridge'))).toBe(
      resolve(root, 'main.ts'),
    );
  });

  it('returns undefined when no main.ts exists under the root', () => {
    const root = fixture('no-match');

    expect(discoverBootstrapFile(root, resolve(root, '.nestbridge'))).toBeUndefined();
  });

  it('returns undefined when multiple main.ts files exist under the root', () => {
    const root = fixture('multiple-matches');

    expect(discoverBootstrapFile(root, resolve(root, '.nestbridge'))).toBeUndefined();
  });

  it('excludes a main.ts found under the output directory', () => {
    const root = fixture('with-output-dir');

    expect(discoverBootstrapFile(root, resolve(root, '.nestbridge'))).toBe(
      resolve(root, 'main.ts'),
    );
  });

  it('excludes a main.ts found under node_modules', () => {
    const root = fixture('with-node-modules');

    expect(discoverBootstrapFile(root, resolve(root, '.nestbridge'))).toBe(
      resolve(root, 'main.ts'),
    );
  });
});
