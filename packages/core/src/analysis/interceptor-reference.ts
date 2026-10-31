import type { Node, SourceFile } from 'typescript/unstable/ast';

export interface InterceptorReference {
  className: string;
  node: Node;
  sourceFile: SourceFile;
  filePath: string;
}
