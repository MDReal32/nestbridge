import { openSourceFile } from './open-source-file';

export const parseSourceFile = (filePath: string) => openSourceFile(filePath).sourceFile;
