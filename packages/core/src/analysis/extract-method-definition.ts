import type { MethodDeclaration, SourceFile } from 'typescript/unstable/ast';
import { isCallExpression } from 'typescript/unstable/ast';
import type { NestBridgeDiagnostic } from '../diagnostics';
import { HTTP_METHOD_DECORATOR_NAMES } from '../models';
import {
  decoratorNameOf,
  findAnyDecorator,
  findDecorator,
  readStaticStringArgument,
} from './decorator-inspection';
import {
  extractParameterDefinition,
  isServerResolvedParameter,
} from './extract-parameter-definition';
import { locationOf } from './node-location';
import { readResponseKind } from './read-response-kind';
import { readRouteVersion } from './read-route-version';
import { joinRoutePath } from './route-path';

interface ExtractionContext {
  sourceFile: SourceFile;
  filePath: string;
  controllerName: string;
  controllerPath: string;
  controllerVersion: string | null | undefined;
  diagnostics: NestBridgeDiagnostic[];
}

const VERSION_DECORATOR_NAME = 'Version';

const readMethodVersion = (method: MethodDeclaration, context: ExtractionContext) => {
  const decorator = findDecorator(method, VERSION_DECORATOR_NAME);

  if (decorator === undefined) {
    return { value: context.controllerVersion };
  }

  const [argument] = isCallExpression(decorator.expression) ? decorator.expression.arguments : [];
  const routeVersion = argument === undefined ? undefined : readRouteVersion(argument);

  if (routeVersion?.ok === true) {
    return { value: routeVersion.version };
  }

  const location = locationOf(context.sourceFile, method);

  context.diagnostics.push({
    code: 'unsupported-route',
    title: 'Unsupported route.',
    controllerName: context.controllerName,
    memberName: method.name.getText(),
    detail: 'Route versions must be statically analyzable.',
    found: `@Version(${routeVersion?.argumentText ?? ''})`,
    filePath: context.filePath,
    line: location.line,
    column: location.column,
  });
  return undefined;
};

export const extractMethodDefinition = (method: MethodDeclaration, context: ExtractionContext) => {
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

  const version = readMethodVersion(method, context);

  if (version === undefined) {
    return undefined;
  }

  const serverOnlyParameterIndexes = method.parameters.flatMap((parameter, index) =>
    isServerResolvedParameter(parameter) ? [index] : [],
  );

  const parameters = method.parameters.map((parameter, index) =>
    serverOnlyParameterIndexes.includes(index)
      ? null
      : extractParameterDefinition(parameter, index, {
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
    version: version.value,
    parameters: parameters.filter((parameter) => parameter !== undefined && parameter !== null),
    serverOnlyParameterIndexes,
    responseKind: readResponseKind(method.type),
    line: location.line,
    column: location.column,
  };
};
