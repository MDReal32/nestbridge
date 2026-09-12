import { globSync } from 'node:fs';
import { resolve } from 'node:path';

export const discoverFiles = (
  patterns: readonly string[],
  root: string,
  exclude?: (filePath: string) => boolean,
) => {
  const matches = globSync([...patterns], { cwd: root, exclude });
  return [...new Set(matches.map((match) => resolve(root, match)))].sort();
};
