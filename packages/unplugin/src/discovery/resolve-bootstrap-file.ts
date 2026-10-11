import { resolve } from 'node:path';
import { discoverBootstrapFile } from './discover-bootstrap-file';

export const resolveBootstrapFile = (
  root: string,
  resolvedOutputDir: string,
  bootstrap: string | undefined,
): string | undefined =>
  bootstrap === undefined
    ? discoverBootstrapFile(root, resolvedOutputDir)
    : resolve(root, bootstrap);
