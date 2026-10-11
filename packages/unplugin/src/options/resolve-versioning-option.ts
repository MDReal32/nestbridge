import type { UriVersioning } from '@nestbridge/core';
import type { NestBridgeOptions } from './nestbridge-options';

const DEFAULT_VERSION_PREFIX = 'v';

export const resolveVersioningOption = (
  option: NestBridgeOptions['versioning'],
): UriVersioning | false | undefined => {
  if (option === undefined || option === false) {
    return option;
  }

  return {
    prefix: option.prefix ?? DEFAULT_VERSION_PREFIX,
    defaultVersion: option.defaultVersion,
  };
};
