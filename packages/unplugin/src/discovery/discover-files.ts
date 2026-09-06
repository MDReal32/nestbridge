import { globSync } from 'node:fs';
import { resolve } from 'node:path';

export const discoverFiles = (patterns: readonly string[], root: string) => {
  const matches = globSync([...patterns], { cwd: root });
  return [...new Set(matches.map((match) => resolve(root, match)))].sort();
};
