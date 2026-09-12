import type { CallExpression, Node, SourceFile } from 'typescript/unstable/ast';
import {
  isCallExpression,
  isIdentifier,
  isPropertyAccessExpression,
} from 'typescript/unstable/ast';
import { findImportSource } from './resolve-type-declaration';

const NEST_FACTORY_LOCAL_NAME = 'NestFactory';
const NEST_FACTORY_CREATE_METHOD_NAME = 'create';
const NEST_CORE_MODULE_SPECIFIER = '@nestjs/core';

const collectNestFactoryCreateCalls = (node: Node, calls: CallExpression[]) => {
  if (
    isCallExpression(node) &&
    isPropertyAccessExpression(node.expression) &&
    isIdentifier(node.expression.expression) &&
    node.expression.expression.text === NEST_FACTORY_LOCAL_NAME &&
    node.expression.name.text === NEST_FACTORY_CREATE_METHOD_NAME
  ) {
    calls.push(node);
  }

  node.forEachChild((child) => {
    collectNestFactoryCreateCalls(child, calls);
    return undefined;
  });
};

export const findRootModuleClassName = (sourceFile: SourceFile) => {
  const nestFactoryImportSource = findImportSource(sourceFile, NEST_FACTORY_LOCAL_NAME);

  if (
    nestFactoryImportSource === undefined ||
    nestFactoryImportSource.moduleSpecifierText !== NEST_CORE_MODULE_SPECIFIER
  ) {
    return undefined;
  }

  const calls: CallExpression[] = [];
  collectNestFactoryCreateCalls(sourceFile, calls);

  if (calls.length !== 1) {
    return undefined;
  }

  const [call] = calls;

  if (call === undefined) {
    return undefined;
  }

  const [moduleArgument] = call.arguments;

  return moduleArgument !== undefined && isIdentifier(moduleArgument)
    ? moduleArgument.text
    : undefined;
};
