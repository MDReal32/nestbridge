import type { ControllerParameterDefinition } from './controller-parameter-definition';
import type { HttpMethod } from './http-method';
import type { ResponseKind } from './response-kind';

export interface ControllerMethodDefinition {
  name: string;
  httpMethod: HttpMethod;
  path: string;
  parameters: ControllerParameterDefinition[];
  responseKind: ResponseKind;
  line: number;
  column: number;
}
