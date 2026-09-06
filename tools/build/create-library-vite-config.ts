import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dts } from 'rolldown-plugin-dts';
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

const dtsPlugins = (tsconfigPath: string) =>
  dts({ tsconfig: tsconfigPath, generator: 'oxc' }).map((plugin) =>
    plugin.name.endsWith('fake-js') ? { ...plugin, enforce: 'pre' as const } : plugin,
  );

export const createLibraryViteConfig = (options: LibraryViteConfigOptions) => {
  const manifest = readPackageManifest(options.root);
  const moduleName = moduleNameFromPackageName(manifest.name);
  const outputFileName = `nestbridge.${moduleName}.js`;

  return defineConfig(({ command }) => ({
    plugins: command === 'build' ? dtsPlugins(resolve(options.root, 'tsconfig.json')) : [],
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
  }));
};

export interface MultiEntryLibraryViteConfigOptions {
  root: string;
  entries: Record<string, string>;
}

export const createMultiEntryLibraryViteConfig = (options: MultiEntryLibraryViteConfigOptions) => {
  return defineConfig(({ command }) => ({
    plugins: command === 'build' ? dtsPlugins(resolve(options.root, 'tsconfig.json')) : [],
    build: {
      target: 'esnext',
      sourcemap: true,
      ssr: true,
      outDir: 'build',
      lib: {
        entry: Object.fromEntries(
          Object.entries(options.entries).map(([name, entryPath]) => [
            name,
            resolve(options.root, entryPath),
          ]),
        ),
        formats: ['es'],
        fileName: (_format, entryName) => `${entryName}.js`,
      },
      rollupOptions: {
        external: [/^@nestbridge\//],
      },
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  }));
};
