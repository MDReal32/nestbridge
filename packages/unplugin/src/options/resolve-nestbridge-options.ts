import type { NestBridgePluginOptions } from './nestbridge-plugin-options';
import { resolveNestBridgeEntry } from './resolve-nestbridge-entry';
import type { ResolvedNestBridgeOptions } from './resolved-nestbridge-options';
import { validateNestBridgeEntries } from './validate-nestbridge-entries';

export const resolveNestBridgeOptions = (
  options: NestBridgePluginOptions,
): ResolvedNestBridgeOptions[] => {
  const entries = (Array.isArray(options) ? options : [options]).map(resolveNestBridgeEntry);

  validateNestBridgeEntries(entries);

  return entries;
};
