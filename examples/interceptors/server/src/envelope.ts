import type { EnvelopeMeta } from './envelope-meta';

export interface Envelope<T> {
  data: T;
  meta: EnvelopeMeta;
}
