import type { Node, SourceFile } from 'typescript/unstable/ast';
import type {
  NestBridgeDiagnostic,
  NestBridgeDiagnosticCode,
} from '../diagnostics/nestbridge-diagnostic';
import { locationOf } from './node-location';

interface BootstrapDiagnosticSource {
  code: Extract<NestBridgeDiagnosticCode, 'unsupported-global-prefix' | 'unsupported-versioning'>;
  title: string;
  detail: string;
  expected: string;
  node: Node;
  sourceFile: SourceFile;
  filePath: string;
}

export const createBootstrapDiagnostic = (source: BootstrapDiagnosticSource) => {
  const location = locationOf(source.sourceFile, source.node);

  return {
    code: source.code,
    title: source.title,
    controllerName: '(bootstrap)',
    memberName: '',
    detail: source.detail,
    found: source.node.getText(),
    expected: source.expected,
    filePath: source.filePath,
    line: location.line,
    column: location.column,
  } satisfies NestBridgeDiagnostic;
};
