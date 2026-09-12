import type {
  Block,
  ClassDeclaration,
  Expression,
  MethodDeclaration,
  SourceFile,
} from 'typescript/unstable/ast';
import {
  isArrowFunction,
  isBlock,
  isCallExpression,
  isFunctionExpression,
  isIdentifier,
  isMethodDeclaration,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isReturnStatement,
  isVariableStatement,
} from 'typescript/unstable/ast';
import type { ResponseWrapperDetection } from '../models/response-wrapper-detection';
import { findGlobalInterceptorClassNames } from './find-global-interceptor-class-names';
import { parseSourceFile } from './parse-source-file';
import { findImportSource, resolveClassDeclaration } from './resolve-type-declaration';
import { synthesizeGenericObjectType } from './synthesize-generic-object-type';

const INTERCEPT_METHOD_NAME = 'intercept';
const PIPE_MEMBER_NAME = 'pipe';
const MAP_OPERATOR_NAME = 'map';
const RXJS_MODULE_SPECIFIER = 'rxjs';
const WRAPPED_RESULT_SUBSTITUTION = 'Awaited<Result>';

const unwrapParenthesizedExpression = (expression: Expression) => {
  let unwrapped = expression;

  while (isParenthesizedExpression(unwrapped)) {
    unwrapped = unwrapped.expression;
  }

  return unwrapped;
};

const resolveSoleReturnExpression = (body: Block | Expression) => {
  if (!isBlock(body)) {
    return unwrapParenthesizedExpression(body);
  }

  const localDeclarations = new Map<string, Expression>();
  let returnExpression: Expression | undefined;
  let sawReturn = false;

  for (const statement of body.statements) {
    if (sawReturn) {
      return undefined;
    }

    if (isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!isIdentifier(declaration.name) || declaration.initializer === undefined) {
          return undefined;
        }

        localDeclarations.set(declaration.name.text, declaration.initializer);
      }

      continue;
    }

    if (isReturnStatement(statement)) {
      sawReturn = true;
      returnExpression = statement.expression;
      continue;
    }

    return undefined;
  }

  if (returnExpression === undefined) {
    return undefined;
  }

  return isIdentifier(returnExpression)
    ? localDeclarations.get(returnExpression.text)
    : returnExpression;
};

const matchPipedMapCallback = (expression: Expression, interceptorSourceFile: SourceFile) => {
  if (
    !isCallExpression(expression) ||
    !isPropertyAccessExpression(expression.expression) ||
    expression.expression.name.text !== PIPE_MEMBER_NAME ||
    expression.arguments.length !== 1
  ) {
    return undefined;
  }

  const [operator] = expression.arguments;

  if (
    operator === undefined ||
    !isCallExpression(operator) ||
    !isIdentifier(operator.expression) ||
    operator.expression.text !== MAP_OPERATOR_NAME ||
    operator.arguments.length !== 1
  ) {
    return undefined;
  }

  const mapImportSource = findImportSource(interceptorSourceFile, operator.expression.text);

  if (
    mapImportSource === undefined ||
    mapImportSource.moduleSpecifierText !== RXJS_MODULE_SPECIFIER
  ) {
    return undefined;
  }

  const [callback] = operator.arguments;

  return callback !== undefined && (isArrowFunction(callback) || isFunctionExpression(callback))
    ? callback
    : undefined;
};

const findInterceptMethod = (members: ClassDeclaration['members']) =>
  members.find(
    (member): member is MethodDeclaration =>
      isMethodDeclaration(member) &&
      isIdentifier(member.name) &&
      member.name.text === INTERCEPT_METHOD_NAME,
  );

const synthesizeInterceptorWrapperType = (
  interceptorClassName: string,
  bootstrapSourceFile: SourceFile,
  bootstrapFilePath: string,
  innerTypeSource: string,
) => {
  const resolved = resolveClassDeclaration(
    interceptorClassName,
    bootstrapSourceFile,
    bootstrapFilePath,
  );

  if (resolved === undefined) {
    return undefined;
  }

  const interceptMethod = findInterceptMethod(resolved.classDeclaration.members);

  if (interceptMethod?.body === undefined) {
    return undefined;
  }

  const returnExpression = resolveSoleReturnExpression(interceptMethod.body);

  if (returnExpression === undefined) {
    return undefined;
  }

  const mapCallback = matchPipedMapCallback(returnExpression, resolved.sourceFile);

  if (mapCallback === undefined || mapCallback.parameters.length !== 1) {
    return undefined;
  }

  const [callbackParameter] = mapCallback.parameters;

  if (callbackParameter === undefined || !isIdentifier(callbackParameter.name)) {
    return undefined;
  }

  const callbackReturnExpression = resolveSoleReturnExpression(mapCallback.body);

  if (
    callbackReturnExpression === undefined ||
    !isObjectLiteralExpression(callbackReturnExpression)
  ) {
    return undefined;
  }

  return synthesizeGenericObjectType(
    callbackReturnExpression,
    callbackParameter.name.text,
    innerTypeSource,
  );
};

/**
 * Interceptors registered first wrap those registered after them, so the
 * composed type is built from the last-registered interceptor (closest to the
 * raw handler result) outward to the first-registered one.
 */
export const detectResponseWrapper = (
  bootstrapFilePath: string,
): ResponseWrapperDetection | undefined => {
  const bootstrapSourceFile = parseSourceFile(bootstrapFilePath);
  const interceptorClassNames = findGlobalInterceptorClassNames(bootstrapSourceFile);

  if (interceptorClassNames === undefined) {
    return undefined;
  }

  let composedTypeSource = WRAPPED_RESULT_SUBSTITUTION;

  for (const interceptorClassName of [...interceptorClassNames].reverse()) {
    const wrapperTypeSource = synthesizeInterceptorWrapperType(
      interceptorClassName,
      bootstrapSourceFile,
      bootstrapFilePath,
      composedTypeSource,
    );

    if (wrapperTypeSource === undefined) {
      return undefined;
    }

    composedTypeSource = wrapperTypeSource;
  }

  return { wrappedResultTypeSource: composedTypeSource };
};
