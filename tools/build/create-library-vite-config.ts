import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

interface PackageManifest {
  name: string;
}

export interface LibraryViteConfigOptions {
  root: string;
  entry?: string;
}

const readPackageManifest = (root: string) => {
  const raw = readFileSync(resolve(root, 'package.json'), 'utf-8');
  return JSON.parse(raw) as PackageManifest;
};

const moduleNameFromPackageName = (packageName: string) =>
  packageName.replace(/^@nestbridge\//, '');

export const createLibraryViteConfig = (options: LibraryViteConfigOptions) => {
  const manifest = readPackageManifest(options.root);
  const moduleName = moduleNameFromPackageName(manifest.name);
  const outputFileName = `nestbridge.${moduleName}.js`;

  return defineConfig({
    plugins: [
      dts({
        tsconfigPath: resolve(options.root, 'tsconfig.json'),
        rollupTypes: true,
        include: ['src'],
      }),
    ],
    build: {
      target: 'esnext',
      sourcemap: true,
      ssr: true,
      outDir: 'build',
      lib: {
        entry: resolve(options.root, options.entry ?? 'src/main.ts'),
        formats: ['es'],
        fileName: () => outputFileName,
      },
      rollupOptions: {
        output: {
          entryFileNames: outputFileName,
        },
      },
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  });
};
