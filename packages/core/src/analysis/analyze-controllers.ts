import type { NestBridgeDiagnostic } from '../diagnostics';
import type {
  ControllerAnalysisOptions,
  ControllerAnalysisResult,
  ControllerDefinition,
} from '../models';
import { extractControllerDefinition } from './extract-controller-definition';
import { findControllerClasses } from './find-controller-classes';
import { openSourceFile } from './open-source-file';

export const analyzeControllers = (
  filePaths: readonly string[],
  options: ControllerAnalysisOptions = {},
): ControllerAnalysisResult => {
  const diagnostics: NestBridgeDiagnostic[] = [];
  const controllers: ControllerDefinition[] = [];

  for (const filePath of filePaths) {
    const { sourceFile, checker } = openSourceFile(filePath);

    for (const classDeclaration of findControllerClasses(sourceFile)) {
      const controller = extractControllerDefinition(classDeclaration, {
        sourceFile,
        filePath,
        checker,
        messagePatterns: options.messagePatterns ?? false,
        diagnostics,
      });

      if (controller !== undefined) {
        controllers.push(controller);
      }
    }
  }

  return { controllers, diagnostics };
};
