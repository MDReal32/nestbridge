import type { Block, Expression } from 'typescript/unstable/ast';
import {
  isBlock,
  isIdentifier,
  isReturnStatement,
  isVariableStatement,
} from 'typescript/unstable/ast';
import { unwrapParenthesizedExpression } from './unwrap-parenthesized-expression';

/**
 * Accepts an expression body, or a block that holds nothing but simple `const` declarations and
 * a single trailing `return`. A returned identifier resolves to its declared initializer.
 */
export const resolveSoleReturnExpression = (body: Block | Expression) => {
  if (!isBlock(body)) {
    return unwrapParenthesizedExpression(body);
  }

  const localDeclarations = new Map<string, Expression>();
  let returnExpression: Expression | undefined;
  let sawReturn = false;

  for (const statement of body.statements) {
    if (sawReturn) {
      return undefined;
    }

    if (isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!isIdentifier(declaration.name) || declaration.initializer === undefined) {
          return undefined;
        }

        localDeclarations.set(declaration.name.text, declaration.initializer);
      }

      continue;
    }

    if (isReturnStatement(statement)) {
      sawReturn = true;
      returnExpression = statement.expression;
      continue;
    }

    return undefined;
  }

  if (returnExpression === undefined) {
    return undefined;
  }

  return isIdentifier(returnExpression)
    ? localDeclarations.get(returnExpression.text)
    : returnExpression;
};
