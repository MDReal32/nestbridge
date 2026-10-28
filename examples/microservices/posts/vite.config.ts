import { resolve } from 'node:path';
import { nestBridge } from '@nestbridge/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@users': resolve(import.meta.dirname, '../users/src'),
    },
  },
  plugins: [
    nestBridge({
      name: 'users',
      root: '../users',
      controllers: 'src/**/*.controller.ts',
      messagePatterns: true,
    }),
  ],
  build: {
    target: 'esnext',
    ssr: resolve(import.meta.dirname, 'src/main.ts'),
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'main.js',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
  },
});
