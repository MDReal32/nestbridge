import type { CallExpression, Node, SourceFile } from 'typescript/unstable/ast';
import {
  isBinaryExpression,
  isCallExpression,
  isConditionalExpression,
  isDoStatement,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isIfStatement,
  isPropertyAccessExpression,
  isSwitchStatement,
  isWhileStatement,
  SyntaxKind,
} from 'typescript/unstable/ast';

export interface BootstrapCall {
  call: CallExpression;
  conditional: boolean;
}

const isConditionalContainer = (node: Node) =>
  isIfStatement(node) ||
  isConditionalExpression(node) ||
  isSwitchStatement(node) ||
  isForStatement(node) ||
  isForInStatement(node) ||
  isForOfStatement(node) ||
  isWhileStatement(node) ||
  isDoStatement(node) ||
  (isBinaryExpression(node) &&
    (node.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken ||
      node.operatorToken.kind === SyntaxKind.BarBarToken ||
      node.operatorToken.kind === SyntaxKind.QuestionQuestionToken));

const collect = (node: Node, methodName: string, conditional: boolean, calls: BootstrapCall[]) => {
  if (
    isCallExpression(node) &&
    isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === methodName
  ) {
    calls.push({ call: node, conditional });
  }

  const childConditional = conditional || isConditionalContainer(node);

  node.forEachChild((child) => {
    collect(child, methodName, childConditional, calls);
    return undefined;
  });
};

export const collectBootstrapCalls = (sourceFile: SourceFile, methodName: string) => {
  const calls: BootstrapCall[] = [];
  collect(sourceFile, methodName, false, calls);
  return calls;
};
