import type { ClassDeclaration, MethodDeclaration, SourceFile } from 'typescript/unstable/ast';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import { UNRESOLVED_WRAPPED_RESULT_TYPE_SOURCE } from '../models/response-wrapper-substitution';
import { analyzeInterceptorClass } from './analyze-interceptor-class';
import { composeWrapperTypeSource } from './compose-wrapper-type-source';
import type { ControllerInterceptors } from './controller-interceptors';
import { createInterceptorDiagnostic } from './create-interceptor-diagnostic';
import { findGlobalInterceptorRegistrations } from './find-global-interceptor-registrations';
import { findUseInterceptorsRegistrations } from './find-use-interceptors-registrations';
import type { InterceptorProblem } from './interceptor-problem';
import type { InterceptorReference } from './interceptor-reference';
import type { InterceptorRegistrations } from './interceptor-registrations';
import type { InterceptorShape } from './interceptor-shape';
import { locationOf } from './node-location';
import { resolveClassDeclaration } from './resolve-type-declaration';

const REGISTRATION_SUBJECT = '(interceptors)';
const INTERCEPT_MEMBER_NAME = 'intercept';

export interface InterceptorAnalysisOptions {
  bootstrapFilePath?: string;
  diagnostics: NestBridgeDiagnostic[];
}

/**
 * Resolves, for each JSON route, the interceptors that apply to it (global, then controller, then
 * route, outermost first) and the response shape they give it. Every interceptor class is
 * analyzed once and every problem is reported once, however many routes the interceptor reaches.
 * Global interceptors are only read when the first JSON route asks for them.
 */
export const createInterceptorAnalysis = (options: InterceptorAnalysisOptions) => {
  const { bootstrapFilePath, diagnostics } = options;
  const contributingFiles = new Set<string>();
  const shapesByInterceptor = new Map<string, InterceptorShape | undefined>();
  let globalRegistrations: InterceptorRegistrations | undefined;

  const reportRegistrationProblem = (problem: InterceptorProblem) => {
    diagnostics.push(
      createInterceptorDiagnostic({
        controllerName: REGISTRATION_SUBJECT,
        memberName: '',
        detail: problem.detail,
        location: problem.node,
        sourceFile: problem.sourceFile,
        filePath: problem.filePath,
      }),
    );
  };

  const reportUnresolvedReference = (reference: InterceptorReference) => {
    diagnostics.push(
      createInterceptorDiagnostic({
        controllerName: reference.className,
        memberName: '',
        detail:
          `Interceptor \`${reference.className}\` does not resolve to a class declared in a local ` +
          'source file, so its effect on the response shape is unknown.',
        location: reference.node,
        sourceFile: reference.sourceFile,
        filePath: reference.filePath,
      }),
    );
  };

  const resolveShape = (reference: InterceptorReference) => {
    const resolved = resolveClassDeclaration(
      reference.className,
      reference.sourceFile,
      reference.filePath,
    );

    if (resolved === undefined) {
      const location = locationOf(reference.sourceFile, reference.node);
      const referenceKey = `${reference.filePath}:${location.line}:${location.column}`;

      if (!shapesByInterceptor.has(referenceKey)) {
        shapesByInterceptor.set(referenceKey, undefined);
        reportUnresolvedReference(reference);
      }

      return undefined;
    }

    contributingFiles.add(resolved.filePath);
    const interceptorKey = `${resolved.filePath}#${resolved.classDeclaration.name?.text}`;

    if (shapesByInterceptor.has(interceptorKey)) {
      return shapesByInterceptor.get(interceptorKey);
    }

    const analysis = analyzeInterceptorClass(resolved);

    if (!analysis.ok) {
      diagnostics.push(
        createInterceptorDiagnostic({
          controllerName: resolved.classDeclaration.name?.text ?? reference.className,
          memberName: INTERCEPT_MEMBER_NAME,
          detail: analysis.reason,
          found: analysis.found,
          location: analysis.location,
          sourceFile: resolved.sourceFile,
          filePath: resolved.filePath,
        }),
      );
    }

    const shape = analysis.ok ? analysis.shape : undefined;
    shapesByInterceptor.set(interceptorKey, shape);
    return shape;
  };

  const readGlobalRegistrations = () => {
    if (globalRegistrations === undefined) {
      globalRegistrations =
        bootstrapFilePath === undefined
          ? { references: [], problems: [] }
          : findGlobalInterceptorRegistrations(bootstrapFilePath, contributingFiles);
      globalRegistrations.problems.forEach(reportRegistrationProblem);
    }

    return globalRegistrations;
  };

  const forController = (
    classDeclaration: ClassDeclaration,
    sourceFile: SourceFile,
    filePath: string,
  ) => {
    let controllerRegistrations: InterceptorRegistrations | undefined;

    const readControllerRegistrations = () => {
      if (controllerRegistrations === undefined) {
        controllerRegistrations = findUseInterceptorsRegistrations(
          classDeclaration,
          sourceFile,
          filePath,
        );
        controllerRegistrations.problems.forEach(reportRegistrationProblem);
      }

      return controllerRegistrations;
    };

    const responseWrapperOf = (method: MethodDeclaration) => {
      const methodRegistrations = findUseInterceptorsRegistrations(method, sourceFile, filePath);
      methodRegistrations.problems.forEach(reportRegistrationProblem);

      const chain = [readGlobalRegistrations(), readControllerRegistrations(), methodRegistrations];
      const shapes = chain.flatMap(({ references }) => references.map(resolveShape));
      const hasUnsupportedInterceptor =
        chain.some(({ problems }) => problems.length > 0) ||
        shapes.some((shape) => shape === undefined);

      if (hasUnsupportedInterceptor) {
        return { wrappedResultTypeSource: UNRESOLVED_WRAPPED_RESULT_TYPE_SOURCE };
      }

      const wrappedResultTypeSource = composeWrapperTypeSource(
        shapes.filter((shape) => shape !== undefined),
      );

      return wrappedResultTypeSource === undefined ? undefined : { wrappedResultTypeSource };
    };

    const interceptors: ControllerInterceptors = { responseWrapperOf };
    return interceptors;
  };

  return { forController, contributingFiles: () => [...contributingFiles] };
};
