import type { ClassDeclaration, PropertyAssignment } from 'typescript/unstable/ast';
import {
  isCallExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
} from 'typescript/unstable/ast';
import { findDecorator } from './decorator-inspection';

const MODULE_DECORATOR_NAME = 'Module';

export const hasModuleDecorator = (classDeclaration: ClassDeclaration) =>
  findDecorator(classDeclaration, MODULE_DECORATOR_NAME) !== undefined;

export const readModuleOption = (classDeclaration: ClassDeclaration, optionName: string) => {
  const moduleDecorator = findDecorator(classDeclaration, MODULE_DECORATOR_NAME);

  if (moduleDecorator === undefined || !isCallExpression(moduleDecorator.expression)) {
    return undefined;
  }

  const [moduleOptions] = moduleDecorator.expression.arguments;

  if (moduleOptions === undefined || !isObjectLiteralExpression(moduleOptions)) {
    return undefined;
  }

  return moduleOptions.properties.find(
    (property): property is PropertyAssignment =>
      isPropertyAssignment(property) &&
      isIdentifier(property.name) &&
      property.name.text === optionName,
  );
};
