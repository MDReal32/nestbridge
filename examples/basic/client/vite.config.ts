import { resolve } from 'node:path';
import { nestBridge } from '@nestbridge/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@server': resolve(import.meta.dirname, '../server/src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    nestBridge({
      controllers: '../server/src/**/*.controller.ts',
      resolvers: '../server/src/**/*.resolver.ts',
      baseURL: '/api',
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
