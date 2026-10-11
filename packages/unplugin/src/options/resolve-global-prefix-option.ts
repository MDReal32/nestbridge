import type { GlobalPrefix } from '@nestbridge/core';
import type { NestBridgeOptions } from './nestbridge-options';

export const resolveGlobalPrefixOption = (
  option: NestBridgeOptions['globalPrefix'],
): GlobalPrefix | false | undefined => {
  if (option === undefined || option === false) {
    return option;
  }

  if (typeof option === 'string') {
    return { prefix: option, exclude: [] };
  }

  return {
    prefix: option.prefix,
    exclude: (option.exclude ?? []).map((entry) =>
      typeof entry === 'string' ? { path: entry } : entry,
    ),
  };
};
