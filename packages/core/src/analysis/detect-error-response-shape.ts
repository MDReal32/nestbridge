import type { ClassDeclaration, MethodDeclaration, SourceFile } from 'typescript/unstable/ast';
import {
  isIdentifier,
  isMethodDeclaration,
  isObjectLiteralExpression,
} from 'typescript/unstable/ast';
import type { ErrorResponseShapeDetection } from '../models/error-response-shape-detection';
import { findDecorator } from './decorator-inspection';
import { findAppFilterProviderClassName } from './find-app-filter-provider-class-name';
import { findGlobalFilterClassName } from './find-global-filter-class-name';
import { findRootModuleClassName } from './find-root-module-class-name';
import { parseSourceFile } from './parse-source-file';
import { resolveCatchMethodBody } from './resolve-catch-method-body';
import { type ResolvedTypeDeclaration, resolveClassDeclaration } from './resolve-type-declaration';
import { synthesizeErrorBodyType } from './synthesize-error-body-type';

const CATCH_DECORATOR_NAME = 'Catch';
const CATCH_METHOD_NAME = 'catch';

const findCatchMethod = (members: ClassDeclaration['members']) =>
  members.find(
    (member): member is MethodDeclaration =>
      isMethodDeclaration(member) &&
      isIdentifier(member.name) &&
      member.name.text === CATCH_METHOD_NAME,
  );

const resolveViaGlobalFilters = (bootstrapSourceFile: SourceFile, bootstrapFilePath: string) => {
  const filterClassName = findGlobalFilterClassName(bootstrapSourceFile);

  return filterClassName === undefined
    ? undefined
    : resolveClassDeclaration(filterClassName, bootstrapSourceFile, bootstrapFilePath);
};

const resolveViaAppFilterProvider = (
  bootstrapSourceFile: SourceFile,
  bootstrapFilePath: string,
) => {
  const rootModuleClassName = findRootModuleClassName(bootstrapSourceFile);

  if (rootModuleClassName === undefined) {
    return undefined;
  }

  const resolvedModule = resolveClassDeclaration(
    rootModuleClassName,
    bootstrapSourceFile,
    bootstrapFilePath,
  );

  if (resolvedModule === undefined) {
    return undefined;
  }

  const filterClassName = findAppFilterProviderClassName(
    resolvedModule.classDeclaration,
    resolvedModule.sourceFile,
  );

  return filterClassName === undefined
    ? undefined
    : resolveClassDeclaration(filterClassName, resolvedModule.sourceFile, resolvedModule.filePath);
};

const isSameDeclaration = (a: ResolvedTypeDeclaration, b: ResolvedTypeDeclaration) =>
  a.filePath === b.filePath && a.classDeclaration.name?.text === b.classDeclaration.name?.text;

const reconcileResolvedFilter = (
  viaGlobalFilters: ResolvedTypeDeclaration | undefined,
  viaAppFilterProvider: ResolvedTypeDeclaration | undefined,
) => {
  if (viaGlobalFilters !== undefined && viaAppFilterProvider !== undefined) {
    return isSameDeclaration(viaGlobalFilters, viaAppFilterProvider) ? viaGlobalFilters : undefined;
  }

  return viaGlobalFilters ?? viaAppFilterProvider;
};

export const detectErrorResponseShape = (
  bootstrapFilePath: string,
): ErrorResponseShapeDetection | undefined => {
  const bootstrapSourceFile = parseSourceFile(bootstrapFilePath);

  const resolved = reconcileResolvedFilter(
    resolveViaGlobalFilters(bootstrapSourceFile, bootstrapFilePath),
    resolveViaAppFilterProvider(bootstrapSourceFile, bootstrapFilePath),
  );

  if (
    resolved === undefined ||
    findDecorator(resolved.classDeclaration, CATCH_DECORATOR_NAME) === undefined
  ) {
    return undefined;
  }

  const catchMethod = findCatchMethod(resolved.classDeclaration.members);

  if (catchMethod?.body === undefined) {
    return undefined;
  }

  const bodyResolution = resolveCatchMethodBody(catchMethod);

  if (
    bodyResolution === undefined ||
    !isObjectLiteralExpression(bodyResolution.responseBodyArgument)
  ) {
    return undefined;
  }

  const errorBodyTypeSource = synthesizeErrorBodyType(
    bodyResolution.responseBodyArgument,
    bodyResolution.exceptionParameterName,
    bodyResolution.localDeclarations,
  );

  return errorBodyTypeSource === undefined ? undefined : { errorBodyTypeSource };
};
