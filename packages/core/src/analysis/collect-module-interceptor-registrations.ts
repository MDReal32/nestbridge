import { findAppInterceptorProviderRegistrations } from './find-app-interceptor-provider-registrations';
import type { InterceptorRegistrations } from './interceptor-registrations';
import { readImportedModules } from './read-imported-modules';
import type { ResolvedTypeDeclaration } from './resolve-type-declaration';

/**
 * Nest scans modules depth-first starting at the root module, inserting a module before the
 * modules it imports, and a module reached twice keeps its first position. Registering the
 * `APP_INTERCEPTOR` providers module by module, each module's providers before its imports,
 * reproduces the order in which Nest adds them to the global interceptor list.
 */
export const collectModuleInterceptorRegistrations = (
  rootModule: ResolvedTypeDeclaration,
  contributingFiles: Set<string>,
) => {
  const registrations: InterceptorRegistrations = { references: [], problems: [] };
  const visitedModules = new Set<string>();

  const visit = (module: ResolvedTypeDeclaration) => {
    const moduleKey = `${module.filePath}#${module.classDeclaration.name?.text}`;

    if (visitedModules.has(moduleKey)) {
      return;
    }

    visitedModules.add(moduleKey);
    contributingFiles.add(module.filePath);

    const moduleRegistrations = findAppInterceptorProviderRegistrations(
      module.classDeclaration,
      module.sourceFile,
      module.filePath,
    );
    registrations.references.push(...moduleRegistrations.references);
    registrations.problems.push(...moduleRegistrations.problems);

    for (const importedModule of readImportedModules(module)) {
      visit(importedModule);
    }
  };

  visit(rootModule);

  return registrations;
};
