import { join, relative } from 'node:path';

const stripLeadingParentSegments = (relativePath: string) => {
  const segments = relativePath.split(/[\\/]/);
  const firstOwnedIndex = segments.findIndex((segment) => segment !== '..');
  return segments.slice(firstOwnedIndex === -1 ? segments.length : firstOwnedIndex).join('/');
};

export const mirroredDeclarationPath = (
  root: string,
  outputDir: string,
  controllerFilePath: string,
) => {
  const relativePath = relative(root, controllerFilePath);
  const mirroredPath = stripLeadingParentSegments(relativePath).replace(/\.ts$/, '.d.ts');
  return join(root, outputDir, mirroredPath);
};
