import type { Node } from 'typescript/unstable/ast';
import {
  isArrowFunction,
  isClassDeclaration,
  isClassExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isMethodDeclaration,
  isReturnStatement,
} from 'typescript/unstable/ast';

const isNestedFunctionScope = (node: Node) =>
  isArrowFunction(node) ||
  isFunctionExpression(node) ||
  isFunctionDeclaration(node) ||
  isMethodDeclaration(node) ||
  isClassDeclaration(node) ||
  isClassExpression(node);

export const containsReturnStatement = (node: Node) => {
  if (isReturnStatement(node)) {
    return true;
  }

  if (isNestedFunctionScope(node)) {
    return false;
  }

  let found = false;

  node.forEachChild((child) => {
    if (containsReturnStatement(child)) {
      found = true;
    }

    return undefined;
  });

  return found;
};
