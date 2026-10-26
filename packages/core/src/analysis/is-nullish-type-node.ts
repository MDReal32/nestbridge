import type { TypeNode } from 'typescript/unstable/ast';
import { isLiteralTypeNode, SyntaxKind } from 'typescript/unstable/ast';

export const isNullishTypeNode = (typeNode: TypeNode) =>
  typeNode.kind === SyntaxKind.UndefinedKeyword ||
  typeNode.kind === SyntaxKind.NullKeyword ||
  (isLiteralTypeNode(typeNode) && typeNode.literal.kind === SyntaxKind.NullKeyword);
