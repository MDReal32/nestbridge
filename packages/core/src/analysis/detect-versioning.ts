import type { Node, SourceFile } from 'typescript/unstable/ast';
import {
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isStringLiteralLikeNode,
  SyntaxKind,
} from 'typescript/unstable/ast';
import type { BootstrapDetection } from '../models/bootstrap-detection';
import type { UriVersioning } from '../models/uri-versioning';
import { collectBootstrapCalls } from './collect-bootstrap-calls';
import { createBootstrapDiagnostic } from './create-bootstrap-diagnostic';
import { parseSourceFile } from './parse-source-file';
import { readRouteVersion } from './read-route-version';

const ENABLE_VERSIONING_METHOD_NAME = 'enableVersioning';
const VERSIONING_TYPE_ENUM_NAME = 'VersioningType';
const URI_VERSIONING_TYPE_NAME = 'URI';
const TYPE_OPTION_NAME = 'type';
const PREFIX_OPTION_NAME = 'prefix';
const DEFAULT_VERSION_OPTION_NAME = 'defaultVersion';
const DEFAULT_VERSION_PREFIX = 'v';
const EXPECTED =
  'A single unconditional enableVersioning() call with `type: VersioningType.URI`, a string ' +
  'literal or `false` prefix, and a string literal defaultVersion. Header, media type and ' +
  'custom versioning need request headers NestBridge cannot set. Set the `versioning` option ' +
  'to provide URI versioning explicitly.';

const unsupported = (
  sourceFile: SourceFile,
  filePath: string,
  node: Node,
  detail: string,
): BootstrapDetection<UriVersioning> => ({
  value: undefined,
  diagnostics: [
    createBootstrapDiagnostic({
      code: 'unsupported-versioning',
      title: 'Unsupported versioning.',
      detail,
      expected: EXPECTED,
      node,
      sourceFile,
      filePath,
    }),
  ],
});

const isUriVersioningType = (node: Node) =>
  isPropertyAccessExpression(node) &&
  isIdentifier(node.expression) &&
  node.expression.text === VERSIONING_TYPE_ENUM_NAME &&
  node.name.text === URI_VERSIONING_TYPE_NAME;

export const detectVersioning = (bootstrapFilePath: string): BootstrapDetection<UriVersioning> => {
  const sourceFile = parseSourceFile(bootstrapFilePath);
  const calls = collectBootstrapCalls(sourceFile, ENABLE_VERSIONING_METHOD_NAME);
  const [first] = calls;

  if (first === undefined) {
    return { value: undefined, diagnostics: [] };
  }

  if (calls.length > 1 || first.conditional) {
    return unsupported(
      sourceFile,
      bootstrapFilePath,
      first.call,
      'enableVersioning() must be called exactly once and unconditionally.',
    );
  }

  const [options] = first.call.arguments;

  if (options === undefined || !isObjectLiteralExpression(options)) {
    return unsupported(
      sourceFile,
      bootstrapFilePath,
      first.call,
      'The versioning options must be an object literal.',
    );
  }

  let hasUriType = false;
  let prefix = DEFAULT_VERSION_PREFIX;
  let defaultVersion: string | undefined;

  for (const property of options.properties) {
    if (!isPropertyAssignment(property)) {
      return unsupported(
        sourceFile,
        bootstrapFilePath,
        property,
        'Versioning options must be written as plain properties.',
      );
    }

    const optionName = property.name.getText();
    const value = property.initializer;

    if (optionName === TYPE_OPTION_NAME) {
      if (!isUriVersioningType(value)) {
        return unsupported(
          sourceFile,
          bootstrapFilePath,
          property,
          'Only VersioningType.URI is supported.',
        );
      }

      hasUriType = true;
    }

    if (optionName === PREFIX_OPTION_NAME) {
      if (value.kind === SyntaxKind.FalseKeyword) {
        prefix = '';
      } else if (isStringLiteralLikeNode(value)) {
        prefix = value.text;
      } else {
        return unsupported(
          sourceFile,
          bootstrapFilePath,
          property,
          'The version prefix must be a string literal or false.',
        );
      }
    }

    if (optionName === DEFAULT_VERSION_OPTION_NAME) {
      const routeVersion = readRouteVersion(value);

      if (!routeVersion.ok) {
        return unsupported(
          sourceFile,
          bootstrapFilePath,
          property,
          'The default version must be a string literal.',
        );
      }

      defaultVersion = routeVersion.version ?? undefined;
    }
  }

  if (!hasUriType) {
    return unsupported(
      sourceFile,
      bootstrapFilePath,
      first.call,
      'The versioning type must be VersioningType.URI.',
    );
  }

  return {
    value: defaultVersion === undefined ? { prefix } : { prefix, defaultVersion },
    diagnostics: [],
  };
};
