import type ts from 'typescript';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import { HTTP_METHOD_DECORATOR_NAMES } from '../models/http-method';
import {
  decoratorNameOf,
  findAnyDecorator,
  readStaticStringArgument,
} from './decorator-inspection';
import { extractParameterDefinition } from './extract-parameter-definition';
import { locationOf } from './node-location';
import { joinRoutePath } from './route-path';

interface ExtractionContext {
  sourceFile: ts.SourceFile;
  filePath: string;
  controllerName: string;
  controllerPath: string;
  diagnostics: NestBridgeDiagnostic[];
}

export const extractMethodDefinition = (
  method: ts.MethodDeclaration,
  context: ExtractionContext,
) => {
  const decorator = findAnyDecorator(method, Object.keys(HTTP_METHOD_DECORATOR_NAMES));

  if (decorator === undefined) {
    return undefined;
  }

  const methodName = method.name.getText();
  const decoratorName = decoratorNameOf(decorator);
  const location = locationOf(context.sourceFile, method);

  if (decoratorName === undefined) {
    return undefined;
  }

  const httpMethod = HTTP_METHOD_DECORATOR_NAMES[decoratorName];

  if (httpMethod === undefined) {
    return undefined;
  }

  const routeArgument = readStaticStringArgument(decorator);

  if (!routeArgument.ok) {
    context.diagnostics.push({
      code: 'unsupported-route',
      title: 'Unsupported route.',
      controllerName: context.controllerName,
      memberName: methodName,
      detail: 'Route paths must be statically analyzable.',
      found: `@${decoratorName}(${routeArgument.argumentText})`,
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const parameters = method.parameters.map((parameter, index) =>
    extractParameterDefinition(parameter, index, {
      sourceFile: context.sourceFile,
      filePath: context.filePath,
      controllerName: context.controllerName,
      methodName,
      diagnostics: context.diagnostics,
    }),
  );

  if (parameters.some((parameter) => parameter === undefined)) {
    return undefined;
  }

  return {
    name: methodName,
    httpMethod,
    path: joinRoutePath(context.controllerPath, routeArgument.value),
    parameters: parameters.filter((parameter) => parameter !== undefined),
    line: location.line,
    column: location.column,
  };
};
