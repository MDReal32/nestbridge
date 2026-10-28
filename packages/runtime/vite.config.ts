import { resolve } from 'node:path';
import { createMultiEntryLibraryViteConfig } from '../../tools/build/create-library-vite-config';

export default createMultiEntryLibraryViteConfig({
  root: resolve(import.meta.dirname),
  entries: {
    'nestbridge.runtime': 'src/main.ts',
    'nestbridge.runtime.microservices': 'src/microservices.ts',
  },
});
