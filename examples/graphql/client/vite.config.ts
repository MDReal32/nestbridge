import { resolve } from 'node:path';
import { nestBridge } from '@nestbridge/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@server': resolve(import.meta.dirname, '../server/src'),
      '@events': resolve(import.meta.dirname, '../../observable/server/src'),
    },
  },
  plugins: [
    nestBridge([
      {
        name: 'books',
        root: resolve(import.meta.dirname, '../server'),
        controllers: 'src/**/*.controller.ts',
        resolvers: 'src/**/*.resolver.ts',
        baseURL: 'http://localhost:3500',
      },
      {
        name: 'events',
        root: resolve(import.meta.dirname, '../../observable/server'),
        controllers: 'src/**/*.controller.ts',
        baseURL: 'http://localhost:3501',
      },
    ]),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
