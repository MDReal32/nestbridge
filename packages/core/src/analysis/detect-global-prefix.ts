import type { Node, SourceFile } from 'typescript/unstable/ast';
import { isStringLiteralLikeNode } from 'typescript/unstable/ast';
import type { BootstrapDetection } from '../models/bootstrap-detection';
import type { GlobalPrefix } from '../models/global-prefix';
import { collectBootstrapCalls } from './collect-bootstrap-calls';
import { createBootstrapDiagnostic } from './create-bootstrap-diagnostic';
import { parseSourceFile } from './parse-source-file';
import { readGlobalPrefixExclusions } from './read-global-prefix-exclusions';

const SET_GLOBAL_PREFIX_METHOD_NAME = 'setGlobalPrefix';
const EXPECTED =
  'A single unconditional setGlobalPrefix() call with a string literal prefix and exclude ' +
  'entries written as string literals or { path, method } literals. Set the `globalPrefix` ' +
  'option to provide the prefix explicitly.';

const unsupported = (
  sourceFile: SourceFile,
  filePath: string,
  node: Node,
  detail: string,
): BootstrapDetection<GlobalPrefix> => ({
  value: undefined,
  diagnostics: [
    createBootstrapDiagnostic({
      code: 'unsupported-global-prefix',
      title: 'Unsupported global prefix.',
      detail,
      expected: EXPECTED,
      node,
      sourceFile,
      filePath,
    }),
  ],
});

export const detectGlobalPrefix = (bootstrapFilePath: string): BootstrapDetection<GlobalPrefix> => {
  const sourceFile = parseSourceFile(bootstrapFilePath);
  const calls = collectBootstrapCalls(sourceFile, SET_GLOBAL_PREFIX_METHOD_NAME);
  const [first] = calls;

  if (first === undefined) {
    return { value: undefined, diagnostics: [] };
  }

  if (calls.length > 1 || first.conditional) {
    return unsupported(
      sourceFile,
      bootstrapFilePath,
      first.call,
      'setGlobalPrefix() must be called exactly once and unconditionally.',
    );
  }

  const [prefixArgument, optionsArgument] = first.call.arguments;

  if (prefixArgument === undefined || !isStringLiteralLikeNode(prefixArgument)) {
    return unsupported(
      sourceFile,
      bootstrapFilePath,
      first.call,
      'The global prefix must be a string literal.',
    );
  }

  const exclude = readGlobalPrefixExclusions(optionsArgument);

  if (exclude === undefined) {
    return unsupported(
      sourceFile,
      bootstrapFilePath,
      first.call,
      'Global prefix exclusions must be statically analyzable.',
    );
  }

  return { value: { prefix: prefixArgument.text, exclude }, diagnostics: [] };
};
