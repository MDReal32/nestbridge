import type { GlobalPrefixExclusion } from '@nestbridge/core';

export interface GlobalPrefixOption {
  prefix: string;
  exclude?: (string | GlobalPrefixExclusion)[];
}
