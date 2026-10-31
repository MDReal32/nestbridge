import type { InterceptorProblem } from './interceptor-problem';
import type { InterceptorReference } from './interceptor-reference';

export interface InterceptorRegistrations {
  references: InterceptorReference[];
  problems: InterceptorProblem[];
}
