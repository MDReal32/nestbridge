import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

const FORBIDDEN_PATTERNS = [
  '@nestjs/common',
  '@nestjs/core',
  '@nestjs/platform-express',
  '@nestjs/graphql',
  '@nestjs/apollo',
  'reflect-metadata',
  'ItemsService',
  'itemsService',
  'BooksService',
  'booksService',
  'x-user-id',
];

describe('client bundle verification', () => {
  it('bundles both HTTP and GraphQL clients without any server implementation', async () => {
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

    expect(bundleContents).toContain('/items/mine');
    expect(bundleContents).toContain('query FindOne');
  });
});
