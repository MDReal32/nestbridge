import { resolve } from 'node:path';
import { createLibraryViteConfig } from '../../tools/build/create-library-vite-config';

export default createLibraryViteConfig({
  root: resolve(import.meta.dirname),
});
