import { API } from 'typescript/unstable/sync';

let sharedApi: API | undefined;

/**
 * The returned checker belongs to the snapshot opened for this file. Opening the next file
 * replaces that snapshot, so finish every checker query before calling this again.
 */
export const openSourceFile = (filePath: string) => {
  sharedApi ??= new API();

  sharedApi.updateSnapshot({ closeFiles: [filePath] });
  const snapshot = sharedApi.updateSnapshot({
    openFiles: [filePath],
    fileChanges: { changed: [filePath] },
  });
  const project = snapshot.getDefaultProjectForFile(filePath);
  const sourceFile = project?.program.getSourceFile(filePath);

  if (project === undefined || sourceFile === undefined) {
    throw new Error(`Unable to parse source file: ${filePath}`);
  }

  return { sourceFile, checker: project.checker };
};
