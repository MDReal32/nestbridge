import type { MethodDeclaration } from 'typescript/unstable/ast';
import type { ResponseWrapperDetection } from '../models/response-wrapper-detection';

export interface ControllerInterceptors {
  responseWrapperOf: (method: MethodDeclaration) => ResponseWrapperDetection | undefined;
}
