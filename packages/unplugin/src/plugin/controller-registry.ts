import {
  analyzeControllers,
  type ControllerDefinition,
  type NestBridgeDiagnostic,
} from '@nestbridge/core';
import { discoverFiles } from '../discovery';
import { normalizePath } from './normalize-path';

export interface ControllerRegistryRefreshResult {
  controllers: ControllerDefinition[];
  diagnostics: NestBridgeDiagnostic[];
}

export interface ControllerRegistry {
  refresh: () => ControllerRegistryRefreshResult;
  get: (filePath: string) => ControllerDefinition | undefined;
  has: (filePath: string) => boolean;
  all: () => ControllerDefinition[];
}

export const createControllerRegistry = (
  patterns: readonly string[],
  root: string,
): ControllerRegistry => {
  const controllersByFile = new Map<string, ControllerDefinition>();

  const refresh = () => {
    controllersByFile.clear();

    const files = discoverFiles(patterns, root);
    const { controllers, diagnostics } = analyzeControllers(files);

    for (const controller of controllers) {
      controllersByFile.set(normalizePath(controller.sourceFile), controller);
    }

    return { controllers, diagnostics };
  };

  return {
    refresh,
    get: (filePath) => controllersByFile.get(filePath),
    has: (filePath) => controllersByFile.has(filePath),
    all: () => [...controllersByFile.values()],
  };
};
