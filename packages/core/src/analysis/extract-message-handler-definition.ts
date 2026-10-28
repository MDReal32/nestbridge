import type { MethodDeclaration, SourceFile } from 'typescript/unstable/ast';
import { isCallExpression, isIdentifier } from 'typescript/unstable/ast';
import type { Checker } from 'typescript/unstable/sync';
import type { NestBridgeDiagnostic } from '../diagnostics';
import { MESSAGE_PATTERN_DECORATOR_NAMES } from '../models';
import { decoratorNameOf, findAnyDecorator } from './decorator-inspection';
import { findPayloadParameterIndex } from './find-payload-parameter-index';
import { locationOf } from './node-location';
import { readMessagePattern } from './read-message-pattern';

interface ExtractionContext {
  sourceFile: SourceFile;
  filePath: string;
  controllerName: string;
  checker: Checker;
  diagnostics: NestBridgeDiagnostic[];
}

export const extractMessageHandlerDefinition = (
  method: MethodDeclaration,
  context: ExtractionContext,
) => {
  const decorator = findAnyDecorator(method, Object.keys(MESSAGE_PATTERN_DECORATOR_NAMES));
  const decoratorName = decorator === undefined ? undefined : decoratorNameOf(decorator);
  const kind =
    decoratorName === undefined ? undefined : MESSAGE_PATTERN_DECORATOR_NAMES[decoratorName];

  if (decorator === undefined || kind === undefined) {
    return undefined;
  }

  const methodName = method.name.getText();
  const location = locationOf(context.sourceFile, method);
  const [patternArgument] = isCallExpression(decorator.expression)
    ? decorator.expression.arguments
    : [];

  const reportUnsupported = (detail: string) => {
    context.diagnostics.push({
      code: 'unsupported-message-pattern',
      title: 'Unsupported message pattern.',
      controllerName: context.controllerName,
      memberName: methodName,
      detail,
      found: `@${decoratorName}(${patternArgument?.getText() ?? ''})`,
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  };

  if (!isIdentifier(method.name)) {
    return reportUnsupported('Message handlers need a plain identifier method name.');
  }

  if (patternArgument === undefined) {
    return reportUnsupported(`@${decoratorName}() needs a pattern.`);
  }

  const pattern = readMessagePattern(patternArgument, context.checker);

  if (pattern === undefined) {
    return reportUnsupported(
      'Message patterns must be statically known: a string or number literal, an object literal of those, or a const value (use "as const" for objects).',
    );
  }

  return {
    name: methodName,
    kind,
    pattern,
    payloadParameterIndex: findPayloadParameterIndex(method),
    line: location.line,
    column: location.column,
  };
};
