import type { ControllerParameterDefinition } from './controller-parameter-definition';
import type { HttpMethod } from './http-method';

export interface ControllerMethodDefinition {
  name: string;
  httpMethod: HttpMethod;
  path: string;
  parameters: ControllerParameterDefinition[];
  line: number;
  column: number;
}
