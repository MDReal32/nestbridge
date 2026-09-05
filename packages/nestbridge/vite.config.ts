import { resolve } from 'node:path';
import { createMultiEntryLibraryViteConfig } from '../../tools/build/create-library-vite-config';

export default createMultiEntryLibraryViteConfig({
  root: resolve(import.meta.dirname),
  entries: {
    index: 'src/index.ts',
    vite: 'src/vite.ts',
  },
});
