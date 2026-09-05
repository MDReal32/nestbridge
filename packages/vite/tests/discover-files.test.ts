import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverFiles } from '../src/discovery';

const fixturesRoot = resolve(import.meta.dirname, 'fixtures');

describe('discoverFiles', () => {
  it('resolves a glob pattern into absolute controller file paths', () => {
    const files = discoverFiles(['server/**/*.controller.ts'], fixturesRoot);

    expect(files).toEqual([resolve(fixturesRoot, 'server/widgets.controller.ts')]);
  });

  it('does not match files that are not controllers', () => {
    const files = discoverFiles(['server/**/*.controller.ts'], fixturesRoot);

    expect(files.some((file) => file.endsWith('user.dto.ts'))).toBe(false);
  });

  it('deduplicates files matched by overlapping patterns', () => {
    const files = discoverFiles(
      ['server/**/*.controller.ts', 'server/widgets.controller.ts'],
      fixturesRoot,
    );

    expect(files).toHaveLength(1);
  });
});
