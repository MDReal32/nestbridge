import type { ControllerParameterDefinition } from './controller-parameter-definition';
import type { HttpMethod } from './http-method';
import type { ResponseKind } from './response-kind';
import type { ResponseWrapperDetection } from './response-wrapper-detection';

export interface ControllerMethodDefinition {
  name: string;
  httpMethod: HttpMethod;
  path: string;
  /**
   * `undefined` means the route states no version, so the application default version applies;
   * `null` is `VERSION_NEUTRAL`, which never adds a version to the URL.
   */
  version?: string | null;
  parameters: ControllerParameterDefinition[];
  /**
   * Positions of parameters carrying a custom decorator such as `@CurrentUser()`. The server
   * resolves them itself, so the generated client neither accepts nor sends them.
   */
  serverOnlyParameterIndexes: number[];
  responseKind: ResponseKind;
  /**
   * The shape the interceptors applying to this JSON route give its response. Absent when none of
   * them changes the shape.
   */
  responseWrapper?: ResponseWrapperDetection;
  line: number;
  column: number;
}
