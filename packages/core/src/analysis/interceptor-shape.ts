import type { MapOperation } from './map-operation';

export interface InterceptorShape {
  /** In pipe order: the first operation receives the handler result. Empty when the shape is unchanged. */
  operations: MapOperation[];
}
