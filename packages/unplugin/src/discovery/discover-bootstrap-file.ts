import { resolve, sep } from 'node:path';
import { discoverFiles } from './discover-files';

const BOOTSTRAP_FILE_PATTERN = '**/main.ts';

export const discoverBootstrapFile = (root: string, resolvedOutputDir: string) => {
  const isExcluded = (filePath: string) => {
    if (filePath.split(/[\\/]/).includes('node_modules')) {
      return true;
    }

    const resolvedPath = resolve(root, filePath);
    return (
      resolvedPath === resolvedOutputDir || resolvedPath.startsWith(`${resolvedOutputDir}${sep}`)
    );
  };

  const matches = discoverFiles([BOOTSTRAP_FILE_PATTERN], root, isExcluded);

  return matches.length === 1 ? matches[0] : undefined;
};
