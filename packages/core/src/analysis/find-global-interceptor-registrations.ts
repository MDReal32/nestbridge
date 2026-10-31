import { collectModuleInterceptorRegistrations } from './collect-module-interceptor-registrations';
import { findBootstrapInterceptorRegistrations } from './find-bootstrap-interceptor-registrations';
import { findRootModuleClassName } from './find-root-module-class-name';
import type { InterceptorRegistrations } from './interceptor-registrations';
import { parseSourceFile } from './parse-source-file';
import { resolveClassDeclaration } from './resolve-type-declaration';

/**
 * The global interceptors in the order Nest runs them, outermost first: the `APP_INTERCEPTOR`
 * providers of the root module and of the local modules it imports, then the interceptors passed
 * to `useGlobalInterceptors()`.
 *
 * Verified against @nestjs/core 12.3.1: `NestFactory.create()` awaits `initialize()`, which calls
 * `DependenciesScanner.applyApplicationProviders()` (nest-factory.js line 108) and pushes every
 * `APP_INTERCEPTOR` instance onto the global list (scanner.js line 386,
 * application-config.js line 60). `useGlobalInterceptors()` can only run once `create()` has
 * returned, and it appends to the same list (application-config.js line 63). The first entry of
 * the list is the outermost interceptor. Request- and transient-scoped `APP_INTERCEPTOR`
 * providers are appended after all of them at request time and are not distinguished here.
 */
export const findGlobalInterceptorRegistrations = (
  bootstrapFilePath: string,
  contributingFiles: Set<string>,
): InterceptorRegistrations => {
  const bootstrapSourceFile = parseSourceFile(bootstrapFilePath);
  contributingFiles.add(bootstrapFilePath);

  const rootModuleClassName = findRootModuleClassName(bootstrapSourceFile);
  const rootModule =
    rootModuleClassName === undefined
      ? undefined
      : resolveClassDeclaration(rootModuleClassName, bootstrapSourceFile, bootstrapFilePath);

  const moduleRegistrations: InterceptorRegistrations =
    rootModule === undefined
      ? { references: [], problems: [] }
      : collectModuleInterceptorRegistrations(rootModule, contributingFiles);
  const bootstrapRegistrations = findBootstrapInterceptorRegistrations(
    bootstrapSourceFile,
    bootstrapFilePath,
  );

  return {
    references: [...moduleRegistrations.references, ...bootstrapRegistrations.references],
    problems: [...moduleRegistrations.problems, ...bootstrapRegistrations.problems],
  };
};
