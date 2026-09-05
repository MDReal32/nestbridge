import ts from 'typescript';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import { findDecorator, readStaticStringArgument } from './decorator-inspection';
import { extractMethodDefinition } from './extract-method-definition';
import { locationOf } from './node-location';

export const extractControllerDefinition = (
  classDeclaration: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  filePath: string,
  diagnostics: NestBridgeDiagnostic[],
) => {
  const controllerName = classDeclaration.name?.text ?? '(anonymous controller)';
  const decorator = findDecorator(classDeclaration, 'Controller');

  if (decorator === undefined) {
    return undefined;
  }

  const location = locationOf(sourceFile, classDeclaration);
  const argument = readStaticStringArgument(decorator);

  if (!argument.ok) {
    diagnostics.push({
      code: 'unsupported-route',
      title: 'Unsupported route.',
      controllerName,
      memberName: '',
      detail: 'Controller paths must be statically analyzable.',
      found: `@Controller(${argument.argumentText})`,
      filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const methods = classDeclaration.members
    .filter((member): member is ts.MethodDeclaration => ts.isMethodDeclaration(member))
    .map((method) =>
      extractMethodDefinition(method, {
        sourceFile,
        filePath,
        controllerName,
        controllerPath: argument.value ?? '',
        diagnostics,
      }),
    )
    .filter((method) => method !== undefined);

  return {
    name: controllerName,
    path: argument.value ?? '',
    sourceFile: filePath,
    methods,
  };
};
