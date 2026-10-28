import { join, relative } from 'node:path';

const stripLeadingParentSegments = (relativePath: string) => {
  const segments = relativePath.split(/[\\/]/);
  const firstOwnedIndex = segments.findIndex((segment) => segment !== '..');
  return segments.slice(firstOwnedIndex === -1 ? segments.length : firstOwnedIndex).join('/');
};

export const mirroredPath = (sourceRoot: string, resolvedOutputDir: string, sourcePath: string) =>
  join(resolvedOutputDir, stripLeadingParentSegments(relative(sourceRoot, sourcePath)));
