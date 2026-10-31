import { isArrayLiteralExpression, isIdentifier } from 'typescript/unstable/ast';
import { hasModuleDecorator, readModuleOption } from './read-module-option';
import { type ResolvedTypeDeclaration, resolveClassDeclaration } from './resolve-type-declaration';

const IMPORTS_OPTION_NAME = 'imports';

/**
 * Only plain class identifiers that resolve to a local `@Module()` class are followed. Dynamic
 * modules such as `FooModule.forRoot()`, `forwardRef()` calls, spreads and package imports are
 * skipped because their providers cannot be read statically.
 */
export const readImportedModules = (module: ResolvedTypeDeclaration) => {
  const importsProperty = readModuleOption(module.classDeclaration, IMPORTS_OPTION_NAME);

  if (importsProperty === undefined || !isArrayLiteralExpression(importsProperty.initializer)) {
    return [];
  }

  const importedModules: ResolvedTypeDeclaration[] = [];

  for (const element of importsProperty.initializer.elements) {
    if (!isIdentifier(element)) {
      continue;
    }

    const resolved = resolveClassDeclaration(element.text, module.sourceFile, module.filePath);

    if (resolved !== undefined && hasModuleDecorator(resolved.classDeclaration)) {
      importedModules.push(resolved);
    }
  }

  return importedModules;
};
