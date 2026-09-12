import type { ClassDeclaration, PropertyAssignment, SourceFile } from 'typescript/unstable/ast';
import {
  isArrayLiteralExpression,
  isCallExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isSpreadElement,
} from 'typescript/unstable/ast';
import { findDecorator } from './decorator-inspection';
import { findImportSource } from './resolve-type-declaration';

const MODULE_DECORATOR_NAME = 'Module';
const PROVIDERS_PROPERTY_NAME = 'providers';
const PROVIDE_PROPERTY_NAME = 'provide';
const USE_CLASS_PROPERTY_NAME = 'useClass';
const APP_FILTER_LOCAL_NAME = 'APP_FILTER';
const NEST_CORE_MODULE_SPECIFIER = '@nestjs/core';

export const findAppFilterProviderClassName = (
  moduleClassDeclaration: ClassDeclaration,
  moduleSourceFile: SourceFile,
) => {
  const moduleDecorator = findDecorator(moduleClassDeclaration, MODULE_DECORATOR_NAME);

  if (moduleDecorator === undefined || !isCallExpression(moduleDecorator.expression)) {
    return undefined;
  }

  const [moduleOptions] = moduleDecorator.expression.arguments;

  if (moduleOptions === undefined || !isObjectLiteralExpression(moduleOptions)) {
    return undefined;
  }

  const providersProperty = moduleOptions.properties.find(
    (property): property is PropertyAssignment =>
      isPropertyAssignment(property) &&
      isIdentifier(property.name) &&
      property.name.text === PROVIDERS_PROPERTY_NAME,
  );

  if (providersProperty === undefined || !isArrayLiteralExpression(providersProperty.initializer)) {
    return undefined;
  }

  const appFilterImportSource = findImportSource(moduleSourceFile, APP_FILTER_LOCAL_NAME);

  if (
    appFilterImportSource === undefined ||
    appFilterImportSource.moduleSpecifierText !== NEST_CORE_MODULE_SPECIFIER
  ) {
    return undefined;
  }

  const classNames = new Set<string>();

  for (const element of providersProperty.initializer.elements) {
    if (isSpreadElement(element)) {
      return undefined;
    }

    if (!isObjectLiteralExpression(element)) {
      continue;
    }

    const provideProperty = element.properties.find(
      (property): property is PropertyAssignment =>
        isPropertyAssignment(property) &&
        isIdentifier(property.name) &&
        property.name.text === PROVIDE_PROPERTY_NAME,
    );

    if (
      provideProperty === undefined ||
      !isIdentifier(provideProperty.initializer) ||
      provideProperty.initializer.text !== APP_FILTER_LOCAL_NAME
    ) {
      continue;
    }

    const useClassProperty = element.properties.find(
      (property): property is PropertyAssignment =>
        isPropertyAssignment(property) &&
        isIdentifier(property.name) &&
        property.name.text === USE_CLASS_PROPERTY_NAME,
    );

    if (useClassProperty === undefined || !isIdentifier(useClassProperty.initializer)) {
      return undefined;
    }

    classNames.add(useClassProperty.initializer.text);
  }

  return classNames.size === 1 ? [...classNames][0] : undefined;
};
