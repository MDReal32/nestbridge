import type { Node, SourceFile } from 'typescript/unstable/ast';

export interface InterceptorProblem {
  node: Node;
  sourceFile: SourceFile;
  filePath: string;
  detail: string;
}
