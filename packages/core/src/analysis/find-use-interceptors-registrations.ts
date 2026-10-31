import type { ClassDeclaration, MethodDeclaration, SourceFile } from 'typescript/unstable/ast';
import { isCallExpression, isIdentifier, isNewExpression } from 'typescript/unstable/ast';
import { findDecorators } from './decorator-inspection';
import type { InterceptorRegistrations } from './interceptor-registrations';
import { findImportSource } from './resolve-type-declaration';

const USE_INTERCEPTORS_DECORATOR_NAME = 'UseInterceptors';
const NEST_COMMON_MODULE_SPECIFIER = '@nestjs/common';

/**
 * Decorators are applied bottom-up and each one appends to the target's interceptor metadata, so
 * stacked `@UseInterceptors()` decorators contribute in reverse source order.
 */
export const findUseInterceptorsRegistrations = (
  target: ClassDeclaration | MethodDeclaration,
  sourceFile: SourceFile,
  filePath: string,
): InterceptorRegistrations => {
  const registrations: InterceptorRegistrations = { references: [], problems: [] };
  const importSource = findImportSource(sourceFile, USE_INTERCEPTORS_DECORATOR_NAME);

  if (
    importSource === undefined ||
    importSource.moduleSpecifierText !== NEST_COMMON_MODULE_SPECIFIER ||
    importSource.importedName !== USE_INTERCEPTORS_DECORATOR_NAME
  ) {
    return registrations;
  }

  const decorators = findDecorators(target, USE_INTERCEPTORS_DECORATOR_NAME).reverse();

  for (const decorator of decorators) {
    if (!isCallExpression(decorator.expression)) {
      continue;
    }

    for (const argument of decorator.expression.arguments) {
      if (isIdentifier(argument)) {
        registrations.references.push({
          className: argument.text,
          node: argument,
          sourceFile,
          filePath,
        });
        continue;
      }

      if (isNewExpression(argument) && isIdentifier(argument.expression)) {
        registrations.references.push({
          className: argument.expression.text,
          node: argument,
          sourceFile,
          filePath,
        });
        continue;
      }

      registrations.problems.push({
        node: argument,
        sourceFile,
        filePath,
        detail:
          '@UseInterceptors() arguments must be interceptor classes or `new InterceptorClass()` to be analyzed.',
      });
    }
  }

  return registrations;
};
