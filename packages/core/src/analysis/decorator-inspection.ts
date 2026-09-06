import type {
  ClassDeclaration,
  Decorator,
  MethodDeclaration,
  ParameterDeclaration,
  PropertyDeclaration,
} from 'typescript/unstable/ast';
import {
  isCallExpression,
  isDecorator,
  isIdentifier,
  isStringLiteralLikeNode,
} from 'typescript/unstable/ast';

const getDecorators = (
  node: ClassDeclaration | MethodDeclaration | ParameterDeclaration | PropertyDeclaration,
) => {
  const decorators = node.modifiers?.filter(isDecorator);
  return decorators === undefined || decorators.length === 0 ? undefined : decorators;
};

export const findDecorator = (
  node: ClassDeclaration | MethodDeclaration | ParameterDeclaration | PropertyDeclaration,
  decoratorName: string,
) => {
  const decorators = getDecorators(node);

  if (decorators === undefined) {
    return undefined;
  }

  return decorators.find((decorator) => decoratorNameOf(decorator) === decoratorName);
};

export const findAnyDecorator = (
  node: ClassDeclaration | MethodDeclaration | ParameterDeclaration | PropertyDeclaration,
  decoratorNames: readonly string[],
) => {
  const decorators = getDecorators(node);

  if (decorators === undefined) {
    return undefined;
  }

  return decorators.find((decorator) => decoratorNames.includes(decoratorNameOf(decorator) ?? ''));
};

export const decoratorNameOf = (decorator: Decorator) => {
  const expression = decorator.expression;

  if (isCallExpression(expression) && isIdentifier(expression.expression)) {
    return expression.expression.text;
  }

  if (isIdentifier(expression)) {
    return expression.text;
  }

  return undefined;
};

export const readStaticStringArgument = (decorator: Decorator) => {
  const expression = decorator.expression;

  if (!isCallExpression(expression)) {
    return { ok: true, value: undefined };
  }

  const [firstArgument] = expression.arguments;

  if (firstArgument === undefined) {
    return { ok: true, value: undefined };
  }

  if (isStringLiteralLikeNode(firstArgument)) {
    return { ok: true, value: firstArgument.text };
  }

  return { ok: false, argumentText: firstArgument.getText() };
};
