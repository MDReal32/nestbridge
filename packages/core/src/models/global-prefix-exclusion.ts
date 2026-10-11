import type { HttpMethod } from './http-method';

export interface GlobalPrefixExclusion {
  path: string;
  httpMethod?: HttpMethod;
}
