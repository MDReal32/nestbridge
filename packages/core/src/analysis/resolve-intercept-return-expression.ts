import type { Block, Expression } from 'typescript/unstable/ast';
import { isIdentifier, isReturnStatement, isVariableStatement } from 'typescript/unstable/ast';
import { containsReturnStatement } from './contains-return-statement';
import { unwrapParenthesizedExpression } from './unwrap-parenthesized-expression';

/**
 * Any statements may precede the final `return` (logger setup, `const startedAt = Date.now()`),
 * but none of them may return early, since the response shape would then depend on the branch.
 * A returned identifier resolves to the initializer of the `const` declared with that name.
 */
export const resolveInterceptReturnExpression = (body: Block) => {
  const finalStatement = body.statements[body.statements.length - 1];

  if (
    finalStatement === undefined ||
    !isReturnStatement(finalStatement) ||
    finalStatement.expression === undefined
  ) {
    return {
      ok: false,
      node: finalStatement ?? body,
      reason: 'The last statement of intercept() must be a `return` statement with a value.',
    } as const;
  }

  const localDeclarations = new Map<string, Expression>();

  for (const statement of body.statements) {
    if (statement === finalStatement) {
      continue;
    }

    if (containsReturnStatement(statement)) {
      return {
        ok: false,
        node: statement,
        reason:
          'intercept() returns before its last statement, so the response shape is ambiguous.',
      } as const;
    }

    if (isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (isIdentifier(declaration.name) && declaration.initializer !== undefined) {
          localDeclarations.set(declaration.name.text, declaration.initializer);
        }
      }
    }
  }

  const returned = unwrapParenthesizedExpression(finalStatement.expression);

  if (!isIdentifier(returned)) {
    return { ok: true, expression: returned } as const;
  }

  const initializer = localDeclarations.get(returned.text);

  return initializer === undefined
    ? ({
        ok: false,
        node: returned,
        reason: `\`${returned.text}\` is not a local \`const\` initialized inside intercept().`,
      } as const)
    : ({ ok: true, expression: unwrapParenthesizedExpression(initializer) } as const);
};
