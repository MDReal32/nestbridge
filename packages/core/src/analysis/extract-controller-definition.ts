import type { ClassDeclaration, MethodDeclaration, SourceFile } from 'typescript/unstable/ast';
import { isMethodDeclaration } from 'typescript/unstable/ast';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import { findDecorator } from './decorator-inspection';
import { extractMethodDefinition } from './extract-method-definition';
import { locationOf } from './node-location';
import { readControllerOptions } from './read-controller-options';

export const extractControllerDefinition = (
  classDeclaration: ClassDeclaration,
  sourceFile: SourceFile,
  filePath: string,
  diagnostics: NestBridgeDiagnostic[],
) => {
  const controllerName = classDeclaration.name?.text ?? '(anonymous controller)';
  const decorator = findDecorator(classDeclaration, 'Controller');

  if (decorator === undefined) {
    return undefined;
  }

  const location = locationOf(sourceFile, classDeclaration);
  const options = readControllerOptions(decorator);

  if (!options.ok) {
    diagnostics.push({
      code: 'unsupported-route',
      title: 'Unsupported route.',
      controllerName,
      memberName: '',
      detail: 'Controller paths and versions must be statically analyzable.',
      found: `@Controller(${options.argumentText})`,
      filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const methods = classDeclaration.members
    .filter((member): member is MethodDeclaration => isMethodDeclaration(member))
    .map((method) =>
      extractMethodDefinition(method, {
        sourceFile,
        filePath,
        controllerName,
        controllerPath: options.path ?? '',
        controllerVersion: options.version,
        diagnostics,
      }),
    )
    .filter((method) => method !== undefined);

  return {
    name: controllerName,
    path: options.path ?? '',
    sourceFile: filePath,
    methods,
  };
};
