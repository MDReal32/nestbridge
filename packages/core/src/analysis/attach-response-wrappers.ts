import type { ClassDeclaration, MethodDeclaration } from 'typescript/unstable/ast';
import { isMethodDeclaration } from 'typescript/unstable/ast';
import type { ControllerDefinition } from '../models/controller-definition';
import type { ControllerInterceptors } from './controller-interceptors';

export const attachResponseWrappers = (
  controller: ControllerDefinition,
  classDeclaration: ClassDeclaration,
  interceptors: ControllerInterceptors,
) => {
  const memberMethods = classDeclaration.members.filter((member): member is MethodDeclaration =>
    isMethodDeclaration(member),
  );

  const methods = controller.methods.map((method) => {
    const declaration = memberMethods.find((candidate) => candidate.name.getText() === method.name);
    const responseWrapper =
      method.responseKind === 'json' && declaration !== undefined
        ? interceptors.responseWrapperOf(declaration)
        : undefined;

    return responseWrapper === undefined ? method : { ...method, responseWrapper };
  });

  return { ...controller, methods };
};
