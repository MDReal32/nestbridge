import ts from 'typescript';

export interface ReadGraphqlOperationNameResult {
  ok: boolean;
  value?: string;
  argumentText?: string;
}

const readNameFromOptions = (optionsArgument: ts.ObjectLiteralExpression) => {
  const nameProperty = optionsArgument.properties.find(
    (property): property is ts.PropertyAssignment =>
      ts.isPropertyAssignment(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === 'name',
  );

  if (nameProperty === undefined || !ts.isStringLiteralLike(nameProperty.initializer)) {
    return undefined;
  }

  return nameProperty.initializer.text;
};

export const readGraphqlOperationName = (
  decorator: ts.Decorator,
): ReadGraphqlOperationNameResult => {
  const expression = decorator.expression;

  if (!ts.isCallExpression(expression)) {
    return { ok: true, value: undefined };
  }

  let value: string | undefined;

  for (const argument of expression.arguments) {
    if (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)) {
      continue;
    }

    if (ts.isStringLiteralLike(argument)) {
      value = argument.text;
      continue;
    }

    if (ts.isObjectLiteralExpression(argument)) {
      value = readNameFromOptions(argument) ?? value;
      continue;
    }

    return { ok: false, argumentText: argument.getText() };
  }

  return { ok: true, value };
};
