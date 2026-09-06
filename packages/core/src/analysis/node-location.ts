import type { Node, SourceFile } from 'typescript/unstable/ast';

export const locationOf = (sourceFile: SourceFile, node: Node) => {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: line + 1, column: character + 1 };
};
