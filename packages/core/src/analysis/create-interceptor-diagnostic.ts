import type { Node, SourceFile } from 'typescript/unstable/ast';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import { locationOf } from './node-location';

interface InterceptorDiagnosticSource {
  controllerName: string;
  memberName: string;
  detail: string;
  found?: string;
  location: Node;
  sourceFile: SourceFile;
  filePath: string;
}

const EXPECTED =
  'An intercept() method that returns next.handle(), optionally piped through rxjs `map` ' +
  'operators that return object literals and the shape-neutral `tap`, `timeout` and `finalize` ' +
  'operators, registered as a class or `new Class()`. Routes under an interceptor that cannot ' +
  'be analyzed are declared as AbortablePromise<unknown>.';

export const createInterceptorDiagnostic = (source: InterceptorDiagnosticSource) => {
  const location = locationOf(source.sourceFile, source.location);

  return {
    code: 'unsupported-interceptor',
    title: 'Unsupported interceptor.',
    controllerName: source.controllerName,
    memberName: source.memberName,
    detail: source.detail,
    found: source.found ?? source.location.getText(),
    expected: EXPECTED,
    filePath: source.filePath,
    line: location.line,
    column: location.column,
  } satisfies NestBridgeDiagnostic;
};
