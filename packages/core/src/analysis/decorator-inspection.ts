import ts from 'typescript';

export const findDecorator = (
  node: ts.ClassDeclaration | ts.MethodDeclaration | ts.ParameterDeclaration,
  decoratorName: string,
) => {
  const decorators = ts.getDecorators(node);

  if (decorators === undefined) {
    return undefined;
  }

  return decorators.find((decorator) => decoratorNameOf(decorator) === decoratorName);
};

export const findAnyDecorator = (
  node: ts.ClassDeclaration | ts.MethodDeclaration | ts.ParameterDeclaration,
  decoratorNames: readonly string[],
) => {
  const decorators = ts.getDecorators(node);

  if (decorators === undefined) {
    return undefined;
  }

  return decorators.find((decorator) => decoratorNames.includes(decoratorNameOf(decorator) ?? ''));
};

export const decoratorNameOf = (decorator: ts.Decorator) => {
  const expression = decorator.expression;

  if (ts.isCallExpression(expression) && ts.isIdentifier(expression.expression)) {
    return expression.expression.text;
  }

  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  return undefined;
};

export const readStaticStringArgument = (decorator: ts.Decorator) => {
  const expression = decorator.expression;

  if (!ts.isCallExpression(expression)) {
    return { ok: true, value: undefined };
  }

  const [firstArgument] = expression.arguments;

  if (firstArgument === undefined) {
    return { ok: true, value: undefined };
  }

  if (ts.isStringLiteralLike(firstArgument)) {
    return { ok: true, value: firstArgument.text };
  }

  return { ok: false, argumentText: firstArgument.getText() };
};
