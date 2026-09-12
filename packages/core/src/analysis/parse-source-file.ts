import { API } from 'typescript/unstable/sync';

let sharedApi: API | undefined;

export const parseSourceFile = (filePath: string) => {
  sharedApi ??= new API();

  sharedApi.updateSnapshot({ closeFiles: [filePath] });
  const snapshot = sharedApi.updateSnapshot({
    openFiles: [filePath],
    fileChanges: { changed: [filePath] },
  });
  const project = snapshot.getDefaultProjectForFile(filePath);
  const sourceFile = project?.program.getSourceFile(filePath);

  if (sourceFile === undefined) {
    throw new Error(`Unable to parse source file: ${filePath}`);
  }

  return sourceFile;
};
