import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
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
});
