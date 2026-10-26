import type { NestBridgeOptions } from './nestbridge-options';
import { resolveGlobalPrefixOption } from './resolve-global-prefix-option';
import { resolveVersioningOption } from './resolve-versioning-option';
import type { ResolvedNestBridgeOptions } from './resolved-nestbridge-options';

const toArray = (value: string | string[] | undefined) => {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

export const resolveNestBridgeEntry = (options: NestBridgeOptions): ResolvedNestBridgeOptions => ({
  name: options.name,
  controllers: toArray(options.controllers),
  resolvers: toArray(options.resolvers),
  baseURL: options.baseURL,
  bootstrap: options.bootstrap,
  globalPrefix: resolveGlobalPrefixOption(options.globalPrefix),
  versioning: resolveVersioningOption(options.versioning),
  debug: options.debug ?? false,
  logLevel: options.logLevel,
  outputDir: options.outputDir,
  root: options.root,
});
