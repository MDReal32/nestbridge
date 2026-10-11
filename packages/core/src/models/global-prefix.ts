import type { GlobalPrefixExclusion } from './global-prefix-exclusion';

export interface GlobalPrefix {
  prefix: string;
  exclude: GlobalPrefixExclusion[];
}
