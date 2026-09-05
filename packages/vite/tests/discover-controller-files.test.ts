import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverControllerFiles } from '../src/discovery';

const fixturesRoot = resolve(import.meta.dirname, 'fixtures');

describe('discoverControllerFiles', () => {
  it('resolves a glob pattern into absolute controller file paths', () => {
    const files = discoverControllerFiles(['server/**/*.controller.ts'], fixturesRoot);

    expect(files).toEqual([resolve(fixturesRoot, 'server/widgets.controller.ts')]);
  });

  it('does not match files that are not controllers', () => {
    const files = discoverControllerFiles(['server/**/*.controller.ts'], fixturesRoot);

    expect(files.some((file) => file.endsWith('user.dto.ts'))).toBe(false);
  });

  it('deduplicates files matched by overlapping patterns', () => {
    const files = discoverControllerFiles(
      ['server/**/*.controller.ts', 'server/widgets.controller.ts'],
      fixturesRoot,
    );

    expect(files).toHaveLength(1);
  });
});
