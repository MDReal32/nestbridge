import type { ClassDeclaration, MethodDeclaration } from 'typescript/unstable/ast';
import { isIdentifier, isMethodDeclaration } from 'typescript/unstable/ast';
import { analyzeInterceptMethod } from './analyze-intercept-method';
import type { ResolvedTypeDeclaration } from './resolve-type-declaration';

const INTERCEPT_METHOD_NAME = 'intercept';

const findInterceptMethod = (members: ClassDeclaration['members']) =>
  members.find(
    (member): member is MethodDeclaration =>
      isMethodDeclaration(member) &&
      isIdentifier(member.name) &&
      member.name.text === INTERCEPT_METHOD_NAME,
  );

export const analyzeInterceptorClass = (resolved: ResolvedTypeDeclaration) => {
  const interceptMethod = findInterceptMethod(resolved.classDeclaration.members);

  if (interceptMethod === undefined) {
    return {
      ok: false,
      location: resolved.classDeclaration,
      found: undefined,
      reason: 'The class declares no intercept() method of its own.',
    } as const;
  }

  const analysis = analyzeInterceptMethod(interceptMethod, resolved.sourceFile);

  return analysis.ok
    ? analysis
    : ({
        ok: false,
        location: interceptMethod,
        found: analysis.node.getText(),
        reason: analysis.reason,
      } as const);
};
