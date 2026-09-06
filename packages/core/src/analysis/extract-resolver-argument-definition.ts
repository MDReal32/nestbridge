import type { ParameterDeclaration, SourceFile } from 'typescript/unstable/ast';
import { isIdentifier } from 'typescript/unstable/ast';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import type { ResolverArgumentDefinition } from '../models/resolver-argument-definition';
import { findAnyDecorator, readStaticStringArgument } from './decorator-inspection';
import { graphqlTypeStringFor, unwrapTypeNode } from './graphql-scalar-type';
import { locationOf } from './node-location';
import { readArgsTypeOption } from './read-args-type-option';

interface ExtractionContext {
  sourceFile: SourceFile;
  filePath: string;
  resolverName: string;
  methodName: string;
  diagnostics: NestBridgeDiagnostic[];
}

export const extractResolverArgumentDefinition = (
  parameter: ParameterDeclaration,
  index: number,
  context: ExtractionContext,
): ResolverArgumentDefinition | undefined => {
  const decorator = findAnyDecorator(parameter, ['Args']);
  const location = locationOf(context.sourceFile, parameter);

  if (decorator === undefined) {
    context.diagnostics.push({
      code: 'unsupported-argument',
      title: 'Unsupported argument.',
      controllerName: context.resolverName,
      memberName: context.methodName,
      detail: `Parameter "${parameter.name.getText()}" must be decorated with @Args to be transported through a NestBridge GraphQL client.`,
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  if (!isIdentifier(parameter.name)) {
    context.diagnostics.push({
      code: 'unsupported-argument',
      title: 'Unsupported argument.',
      controllerName: context.resolverName,
      memberName: context.methodName,
      detail: 'Destructured parameters cannot be transported through a NestBridge GraphQL client.',
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const nameArgument = readStaticStringArgument(decorator);

  if (!nameArgument.ok) {
    context.diagnostics.push({
      code: 'unsupported-argument',
      title: 'Unsupported argument.',
      controllerName: context.resolverName,
      memberName: context.methodName,
      detail: '@Args() name must be a statically analyzable string literal.',
      found: `@Args(${nameArgument.argumentText})`,
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  if (nameArgument.value === undefined) {
    context.diagnostics.push({
      code: 'unsupported-argument',
      title: 'Unsupported argument.',
      controllerName: context.resolverName,
      memberName: context.methodName,
      detail: "A whole @Args() is not supported; provide an argument name such as @Args('id').",
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  if (parameter.type === undefined) {
    context.diagnostics.push({
      code: 'unsupported-argument',
      title: 'Unsupported argument.',
      controllerName: context.resolverName,
      memberName: context.methodName,
      detail: `@Args() parameter "${parameter.name.text}" needs an explicit type annotation.`,
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const unwrapped = unwrapTypeNode(parameter.type);

  if (unwrapped === undefined) {
    context.diagnostics.push({
      code: 'unsupported-argument',
      title: 'Unsupported argument.',
      controllerName: context.resolverName,
      memberName: context.methodName,
      detail: `@Args() parameter "${parameter.name.text}" has a type NestBridge cannot statically resolve to a GraphQL type.`,
      found: parameter.type.getText(),
      filePath: context.filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const explicitType = readArgsTypeOption(decorator);

  return {
    index,
    parameterName: parameter.name.text,
    name: nameArgument.value,
    graphqlType: graphqlTypeStringFor(unwrapped, explicitType?.typeName),
  };
};
