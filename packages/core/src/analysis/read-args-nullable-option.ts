import type { Decorator, PropertyAssignment } from 'typescript/unstable/ast';
import {
  isCallExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
  SyntaxKind,
} from 'typescript/unstable/ast';

export const readArgsNullableOption = (decorator: Decorator) => {
  if (!isCallExpression(decorator.expression)) {
    return false;
  }

  const optionsArgument = decorator.expression.arguments.find(isObjectLiteralExpression);

  const nullableProperty = optionsArgument?.properties.find(
    (property): property is PropertyAssignment =>
      isPropertyAssignment(property) &&
      isIdentifier(property.name) &&
      property.name.text === 'nullable',
  );

  return nullableProperty?.initializer.kind === SyntaxKind.TrueKeyword;
};
