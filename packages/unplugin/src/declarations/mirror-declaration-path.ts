import { mirroredPath } from './mirrored-path';

export const mirroredDeclarationPath = (
  sourceRoot: string,
  resolvedOutputDir: string,
  controllerFilePath: string,
) => mirroredPath(sourceRoot, resolvedOutputDir, controllerFilePath).replace(/\.ts$/, '.d.ts');
