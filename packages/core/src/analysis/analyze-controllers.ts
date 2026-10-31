import type { NestBridgeDiagnostic } from '../diagnostics';
import type {
  ControllerAnalysisOptions,
  ControllerAnalysisResult,
  ControllerDefinition,
} from '../models';
import { attachResponseWrappers } from './attach-response-wrappers';
import { createInterceptorAnalysis } from './create-interceptor-analysis';
import { extractControllerDefinition } from './extract-controller-definition';
import { findControllerClasses } from './find-controller-classes';
import { openSourceFile } from './open-source-file';
import { clearParsedFileCache } from './resolve-type-declaration';

export const analyzeControllers = (
  filePaths: readonly string[],
  options: ControllerAnalysisOptions = {},
): ControllerAnalysisResult => {
  const diagnostics: NestBridgeDiagnostic[] = [];
  const controllers: ControllerDefinition[] = [];
  const interceptors = createInterceptorAnalysis({
    bootstrapFilePath: options.bootstrapFilePath,
    diagnostics,
  });

  clearParsedFileCache();

  for (const filePath of filePaths) {
    const { sourceFile, checker } = openSourceFile(filePath);

    const extractedControllers = findControllerClasses(sourceFile).map((classDeclaration) => ({
      classDeclaration,
      controller: extractControllerDefinition(classDeclaration, {
        sourceFile,
        filePath,
        checker,
        messagePatterns: options.messagePatterns ?? false,
        diagnostics,
      }),
    }));

    for (const { classDeclaration, controller } of extractedControllers) {
      if (controller !== undefined) {
        controllers.push(
          attachResponseWrappers(
            controller,
            classDeclaration,
            interceptors.forController(classDeclaration, sourceFile, filePath),
          ),
        );
      }
    }
  }

  return { controllers, diagnostics, interceptorFiles: interceptors.contributingFiles() };
};
