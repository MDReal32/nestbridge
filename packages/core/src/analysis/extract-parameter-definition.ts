import type { ParameterDeclaration, SourceFile } from 'typescript/unstable/ast';
import { isIdentifier } from 'typescript/unstable/ast';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import type { ControllerParameterDefinition } from '../models/controller-parameter-definition';
import {
  decoratorNameOf,
  findAnyDecorator,
  readStaticStringArgument,
} from './decorator-inspection';
import { locationOf } from './node-location';

const SUPPORTED_PARAMETER_DECORATORS = ['Param', 'Query', 'Body', 'Headers'] as const;
const KNOWN_UNSUPPORTED_PARAMETER_DECORATORS = ['Req', 'Res', 'Request', 'Response'] as const;

interface ExtractionContext {
  sourceFile: SourceFile;
  filePath: string;
  controllerName: string;
  methodName: string;
  diagnostics: NestBridgeDiagnostic[];
}

export const extractParameterDefinition = (
  parameter: ParameterDeclaration,
  index: number,
  context: ExtractionContext,
): ControllerParameterDefinition | undefined => {
  const decorator = findAnyDecorator(parameter, [
    ...SUPPORTED_PARAMETER_DECORATORS,
    ...KNOWN_UNSUPPORTED_PARAMETER_DECORATORS,
  ]);
  const location = locationOf(context.sourceFile, parameter);

  if (decorator === undefined) {
    context.diagnostics.push({
      code: 'unsupported-parameter',
      title: 'Unsupported parameter.',
      controllerName: context.controllerName,
      memberName: context.methodName,
      detail: `Parameter "${parameter.name.getText()}" must be decorated with one of @Param, @Query, @Body, or @Headers to be transported through a NestBridge HTTP client.`,
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const decoratorName = decoratorNameOf(decorator);

  if (
    decoratorName !== undefined &&
    (KNOWN_UNSUPPORTED_PARAMETER_DECORATORS as readonly string[]).includes(decoratorName)
  ) {
    context.diagnostics.push({
      code: 'unsupported-parameter',
      title: 'Unsupported parameter.',
      controllerName: context.controllerName,
      memberName: context.methodName,
      detail: `@${decoratorName}() cannot be transported through a NestBridge HTTP client.`,
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  if (!isIdentifier(parameter.name)) {
    context.diagnostics.push({
      code: 'unsupported-parameter',
      title: 'Unsupported parameter.',
      controllerName: context.controllerName,
      memberName: context.methodName,
      detail: 'Destructured parameters cannot be transported through a NestBridge HTTP client.',
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const argument = readStaticStringArgument(decorator);

  if (!argument.ok) {
    context.diagnostics.push({
      code: 'unsupported-parameter',
      title: 'Unsupported parameter.',
      controllerName: context.controllerName,
      memberName: context.methodName,
      detail: `@${decoratorName}() arguments must be statically analyzable string literals.`,
      found: `@${decoratorName}(${argument.argumentText})`,
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const base = {
    index,
    parameterName: parameter.name.text,
  };

  if (decoratorName === 'Param') {
    if (argument.value === undefined) {
      context.diagnostics.push({
        code: 'unsupported-parameter',
        title: 'Unsupported parameter.',
        controllerName: context.controllerName,
        memberName: context.methodName,
        detail:
          "A whole @Param() is not supported; provide a route parameter name such as @Param('id').",
        filePath: context.filePath,
        line: location.line,
        column: location.column,
      });
      return undefined;
    }

    return { ...base, kind: 'param', name: argument.value };
  }

  if (decoratorName === 'Headers') {
    if (argument.value === undefined) {
      context.diagnostics.push({
        code: 'unsupported-parameter',
        title: 'Unsupported parameter.',
        controllerName: context.controllerName,
        memberName: context.methodName,
        detail:
          "A whole @Headers() is not supported; provide a header name such as @Headers('x-example').",
        filePath: context.filePath,
        line: location.line,
        column: location.column,
      });
      return undefined;
    }

    return { ...base, kind: 'header', name: argument.value };
  }

  if (decoratorName === 'Query') {
    return { ...base, kind: 'query', name: argument.value };
  }

  return { ...base, kind: 'body', name: argument.value };
};
