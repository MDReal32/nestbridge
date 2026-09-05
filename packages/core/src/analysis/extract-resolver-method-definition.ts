import type ts from 'typescript';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import { GRAPHQL_OPERATION_DECORATOR_NAMES } from '../models/graphql-operation-kind';
import type { SelectionField } from '../models/selection-field';
import { decoratorNameOf, findAnyDecorator } from './decorator-inspection';
import { extractResolverArgumentDefinition } from './extract-resolver-argument-definition';
import { extractSelectionFields } from './extract-selection-fields';
import { unwrapTypeNode } from './graphql-scalar-type';
import { locationOf } from './node-location';
import { readGraphqlOperationName } from './read-graphql-operation-name';
import { resolveClassDeclaration } from './resolve-type-declaration';

const PRIMITIVE_SCALAR_NAMES = new Set(['string', 'number', 'boolean']);

interface ExtractionContext {
  sourceFile: ts.SourceFile;
  filePath: string;
  resolverName: string;
  diagnostics: NestBridgeDiagnostic[];
}

export const extractResolverMethodDefinition = (
  method: ts.MethodDeclaration,
  context: ExtractionContext,
) => {
  const decorator = findAnyDecorator(method, Object.keys(GRAPHQL_OPERATION_DECORATOR_NAMES));

  if (decorator === undefined) {
    return undefined;
  }

  const methodName = method.name.getText();
  const decoratorName = decoratorNameOf(decorator);
  const location = locationOf(context.sourceFile, method);

  if (decoratorName === undefined) {
    return undefined;
  }

  const operationKind = GRAPHQL_OPERATION_DECORATOR_NAMES[decoratorName];

  if (operationKind === undefined) {
    return undefined;
  }

  const nameArgument = readGraphqlOperationName(decorator);

  if (!nameArgument.ok) {
    context.diagnostics.push({
      code: 'unsupported-route',
      title: 'Unsupported operation name.',
      controllerName: context.resolverName,
      memberName: methodName,
      detail: 'GraphQL operation names must be statically analyzable string literals.',
      found: `@${decoratorName}(${nameArgument.argumentText})`,
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  if (method.type === undefined) {
    context.diagnostics.push({
      code: 'unsupported-return-type',
      title: 'Unsupported return type.',
      controllerName: context.resolverName,
      memberName: methodName,
      detail:
        'GraphQL resolver methods need an explicit return type annotation so NestBridge can build a selection set.',
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const unwrapped = unwrapTypeNode(method.type);

  if (unwrapped === undefined) {
    context.diagnostics.push({
      code: 'unsupported-return-type',
      title: 'Unsupported return type.',
      controllerName: context.resolverName,
      memberName: methodName,
      detail: 'NestBridge cannot statically resolve this return type to a GraphQL selection set.',
      found: method.type.getText(),
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  let selection: SelectionField[] = [];

  if (!PRIMITIVE_SCALAR_NAMES.has(unwrapped.identifierText)) {
    const resolved = resolveClassDeclaration(
      unwrapped.identifierText,
      context.sourceFile,
      context.filePath,
    );

    if (resolved === undefined) {
      context.diagnostics.push({
        code: 'unsupported-return-type',
        title: 'Unsupported return type.',
        controllerName: context.resolverName,
        memberName: methodName,
        detail: `NestBridge could not locate the declaration of type "${unwrapped.identifierText}".`,
        filePath: context.filePath,
        line: location.line,
        column: location.column,
      });
      return undefined;
    }

    const fields = extractSelectionFields(
      resolved.classDeclaration,
      resolved.sourceFile,
      resolved.filePath,
      {
        resolverName: context.resolverName,
        methodName,
        diagnostics: context.diagnostics,
        visitedTypeNames: new Set(),
      },
    );

    if (fields === undefined) {
      return undefined;
    }

    selection = fields;
  }

  const args = method.parameters.map((parameter, index) =>
    extractResolverArgumentDefinition(parameter, index, {
      sourceFile: context.sourceFile,
      filePath: context.filePath,
      resolverName: context.resolverName,
      methodName,
      diagnostics: context.diagnostics,
    }),
  );

  if (args.some((argument) => argument === undefined)) {
    return undefined;
  }

  return {
    name: methodName,
    operationKind,
    operationName: nameArgument.value ?? methodName,
    arguments: args.filter((argument) => argument !== undefined),
    selection,
    line: location.line,
    column: location.column,
  };
};
