import type {
  ClassDeclaration,
  Node,
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
} from 'typescript/unstable/ast';
import {
  isArrayLiteralExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isSpreadElement,
} from 'typescript/unstable/ast';
import type { InterceptorRegistrations } from './interceptor-registrations';
import { readModuleOption } from './read-module-option';
import { findImportSource } from './resolve-type-declaration';

const PROVIDERS_OPTION_NAME = 'providers';
const PROVIDE_PROPERTY_NAME = 'provide';
const USE_CLASS_PROPERTY_NAME = 'useClass';
const APP_INTERCEPTOR_LOCAL_NAME = 'APP_INTERCEPTOR';
const NEST_CORE_MODULE_SPECIFIER = '@nestjs/core';
const UNSUPPORTED_PROVIDER_PROPERTY_NAMES = ['useFactory', 'useValue', 'useExisting'];

const findProperty = (provider: ObjectLiteralExpression, name: string) =>
  provider.properties.find(
    (property): property is PropertyAssignment =>
      isPropertyAssignment(property) && isIdentifier(property.name) && property.name.text === name,
  );

const findUnsupportedProviderPropertyName = (provider: ObjectLiteralExpression) =>
  UNSUPPORTED_PROVIDER_PROPERTY_NAMES.find((name) => findProperty(provider, name) !== undefined);

/**
 * Reads the `{ provide: APP_INTERCEPTOR, useClass: X }` providers of one module, in the order
 * they are declared. Only `useClass` can be analyzed: `useFactory`, `useValue`, `useExisting` and
 * spread providers are reported as problems because the interceptor behind them is unknown.
 */
export const findAppInterceptorProviderRegistrations = (
  moduleClassDeclaration: ClassDeclaration,
  moduleSourceFile: SourceFile,
  moduleFilePath: string,
): InterceptorRegistrations => {
  const registrations: InterceptorRegistrations = { references: [], problems: [] };
  const providersProperty = readModuleOption(moduleClassDeclaration, PROVIDERS_OPTION_NAME);
  const appInterceptorImportSource = findImportSource(moduleSourceFile, APP_INTERCEPTOR_LOCAL_NAME);

  if (
    providersProperty === undefined ||
    appInterceptorImportSource === undefined ||
    appInterceptorImportSource.moduleSpecifierText !== NEST_CORE_MODULE_SPECIFIER
  ) {
    return registrations;
  }

  const reportProblem = (node: Node, detail: string) => {
    registrations.problems.push({
      node,
      sourceFile: moduleSourceFile,
      filePath: moduleFilePath,
      detail,
    });
  };

  if (!isArrayLiteralExpression(providersProperty.initializer)) {
    reportProblem(
      providersProperty.initializer,
      'The `providers` of a module registering APP_INTERCEPTOR must be an array literal.',
    );
    return registrations;
  }

  for (const element of providersProperty.initializer.elements) {
    if (isSpreadElement(element)) {
      reportProblem(
        element,
        'Spread providers cannot be analyzed, so an APP_INTERCEPTOR provider inside them would be missed.',
      );
      continue;
    }

    if (!isObjectLiteralExpression(element)) {
      continue;
    }

    const provideProperty = findProperty(element, PROVIDE_PROPERTY_NAME);

    if (
      provideProperty === undefined ||
      !isIdentifier(provideProperty.initializer) ||
      provideProperty.initializer.text !== APP_INTERCEPTOR_LOCAL_NAME
    ) {
      continue;
    }

    const unsupportedPropertyName = findUnsupportedProviderPropertyName(element);

    if (unsupportedPropertyName !== undefined) {
      reportProblem(
        element,
        `\`${unsupportedPropertyName}\` interceptor providers can't be analysed; use \`useClass\`.`,
      );
      continue;
    }

    const useClassProperty = findProperty(element, USE_CLASS_PROPERTY_NAME);

    if (useClassProperty === undefined || !isIdentifier(useClassProperty.initializer)) {
      reportProblem(
        element,
        'An APP_INTERCEPTOR provider must state its interceptor as `useClass: InterceptorClass`.',
      );
      continue;
    }

    registrations.references.push({
      className: useClassProperty.initializer.text,
      node: useClassProperty.initializer,
      sourceFile: moduleSourceFile,
      filePath: moduleFilePath,
    });
  }

  return registrations;
};
