import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

const FORBIDDEN_PATTERNS = [
  '@nestjs/common',
  '@nestjs/core',
  '@nestjs/platform-express',
  'rxjs',
  'EventsService',
  'eventsService',
];

describe('client bundle verification', () => {
  it('excludes NestJS, RxJS, and the real controller implementation from the production bundle', async () => {
    const clientRoot = resolve(import.meta.dirname, '..');

    await build({
      root: clientRoot,
      configFile: resolve(clientRoot, 'vite.config.ts'),
      logLevel: 'silent',
    });

    const assetsDir = resolve(clientRoot, 'dist/assets');
    const bundleFiles = readdirSync(assetsDir).filter((file) => file.endsWith('.js'));
    const bundleContents = bundleFiles
      .map((file) => readFileSync(resolve(assetsDir, file), 'utf-8'))
      .join('\n');

    for (const forbidden of FORBIDDEN_PATTERNS) {
      expect(bundleContents).not.toContain(forbidden);
    }

    // Class/identifier names are minified in production, so assert on the
    // generated fetch call shape instead of a literal symbol name. The
    // Observable-returning endpoint still projects to a plain fetch call,
    // since NestJS resolves the Observable to a JSON body server-side.
    expect(bundleContents).toContain('/events/');
    expect(bundleContents).toContain('encodeURIComponent');
  });
});
