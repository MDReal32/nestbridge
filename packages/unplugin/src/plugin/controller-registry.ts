import {
  type ApplicationRouting,
  analyzeControllers,
  applyApplicationRouting,
  type ControllerAnalysisOptions,
  type ControllerDefinition,
  type NestBridgeDiagnostic,
} from '@nestbridge/core';
import { discoverFiles } from '../discovery';
import { normalizePath } from './normalize-path';

export interface ControllerRegistryRefreshResult {
  controllers: ControllerDefinition[];
  diagnostics: NestBridgeDiagnostic[];
  interceptorFiles: string[];
}

export interface ControllerRegistry {
  refresh: (
    routing?: ApplicationRouting,
    bootstrapFilePath?: string,
  ) => ControllerRegistryRefreshResult;
  get: (filePath: string) => ControllerDefinition | undefined;
  has: (filePath: string) => boolean;
  all: () => ControllerDefinition[];
}

export const createControllerRegistry = (
  patterns: readonly string[],
  root: string,
  analysisOptions: ControllerAnalysisOptions,
): ControllerRegistry => {
  const controllersByFile = new Map<string, ControllerDefinition>();

  const refresh = (routing: ApplicationRouting = {}, bootstrapFilePath?: string) => {
    controllersByFile.clear();

    const files = discoverFiles(patterns, root);
    const {
      controllers: analyzed,
      diagnostics,
      interceptorFiles,
    } = analyzeControllers(files, { ...analysisOptions, bootstrapFilePath });
    const controllers = applyApplicationRouting(analyzed, routing);

    for (const controller of controllers) {
      controllersByFile.set(normalizePath(controller.sourceFile), controller);
    }

    return { controllers, diagnostics, interceptorFiles };
  };

  return {
    refresh,
    get: (filePath) => controllersByFile.get(filePath),
    has: (filePath) => controllersByFile.has(filePath),
    all: () => [...controllersByFile.values()],
  };
};
