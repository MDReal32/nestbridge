import type { NestBridgeDiagnostic } from '../diagnostics';
import type { ControllerDefinition } from '../models';
import { extractControllerDefinition } from './extract-controller-definition';
import { findControllerClasses } from './find-controller-classes';
import { parseSourceFile } from './parse-source-file';

export const analyzeControllers = (
  filePaths: readonly string[],
): { controllers: ControllerDefinition[]; diagnostics: NestBridgeDiagnostic[] } => {
  const diagnostics: NestBridgeDiagnostic[] = [];
  const controllers: ControllerDefinition[] = [];

  for (const filePath of filePaths) {
    const sourceFile = parseSourceFile(filePath);

    for (const classDeclaration of findControllerClasses(sourceFile)) {
      const controller = extractControllerDefinition(
        classDeclaration,
        sourceFile,
        filePath,
        diagnostics,
      );

      if (controller !== undefined) {
        controllers.push(controller);
      }
    }
  }

  return { controllers, diagnostics };
};
