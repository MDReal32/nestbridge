import { posix } from 'node:path';

const isWindows = process.platform === 'win32';

export const normalizePath = (filePath: string) =>
  posix.normalize(isWindows ? filePath.replaceAll('\\', '/') : filePath);
