import type { ClassDeclaration, MethodDeclaration, SourceFile } from 'typescript/unstable/ast';
import { isMethodDeclaration } from 'typescript/unstable/ast';
import type { Checker } from 'typescript/unstable/sync';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import { findDecorator } from './decorator-inspection';
import { extractMessageHandlerDefinition } from './extract-message-handler-definition';
import { extractMethodDefinition } from './extract-method-definition';
import { locationOf } from './node-location';
import { readControllerOptions } from './read-controller-options';

interface ExtractionContext {
  sourceFile: SourceFile;
  filePath: string;
  checker: Checker;
  messagePatterns: boolean;
  diagnostics: NestBridgeDiagnostic[];
}

export const extractControllerDefinition = (
  classDeclaration: ClassDeclaration,
  context: ExtractionContext,
) => {
  const { sourceFile, filePath, diagnostics } = context;
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

  const memberMethods = classDeclaration.members.filter((member): member is MethodDeclaration =>
    isMethodDeclaration(member),
  );

  const methods = memberMethods
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

  const messageHandlers = context.messagePatterns
    ? memberMethods
        .map((method) =>
          extractMessageHandlerDefinition(method, {
            sourceFile,
            filePath,
            controllerName,
            checker: context.checker,
            diagnostics,
          }),
        )
        .filter((handler) => handler !== undefined)
    : [];

  return {
    name: controllerName,
    path: options.path ?? '',
    sourceFile: filePath,
    methods,
    messageHandlers,
  };
};
