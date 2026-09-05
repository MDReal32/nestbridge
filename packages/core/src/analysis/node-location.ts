import type ts from 'typescript';

export const locationOf = (sourceFile: ts.SourceFile, node: ts.Node) => {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: line + 1, column: character + 1 };
};
