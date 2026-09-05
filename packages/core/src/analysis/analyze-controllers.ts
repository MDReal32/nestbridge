import { readFileSync } from 'node:fs';
import ts from 'typescript';
import type { NestBridgeDiagnostic } from '../diagnostics';
import type { ControllerDefinition } from '../models';
import { extractControllerDefinition } from './extract-controller-definition';
import { findControllerClasses } from './find-controller-classes';

export const analyzeControllers = (filePaths: readonly string[]) => {
  const diagnostics: NestBridgeDiagnostic[] = [];
  const controllers: ControllerDefinition[] = [];

  for (const filePath of filePaths) {
    const content = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );

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
