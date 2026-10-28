import { LOG_LEVEL_RANKS } from './log-level-ranks';
import type { ResolvedNestBridgeOptions } from './resolved-nestbridge-options';

const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

export const validateNestBridgeEntries = (entries: readonly ResolvedNestBridgeOptions[]): void => {
  if (entries.length === 0) {
    throw new Error('[nestbridge] Pass at least one app to the plugin options.');
  }

  const seenNames = new Set<string>();

  entries.forEach((entry, index) => {
    if (entry.logLevel !== undefined && !Object.hasOwn(LOG_LEVEL_RANKS, entry.logLevel)) {
      throw new Error(
        `[nestbridge] Invalid logLevel "${entry.logLevel}". Use one of: ${Object.keys(LOG_LEVEL_RANKS).join(', ')}.`,
      );
    }

    if (entry.messagePatterns && entry.name === undefined) {
      throw new Error(
        `[nestbridge] App #${index + 1} sets \`messagePatterns\` and needs a \`name\`, the service its message client is looked up by.`,
      );
    }

    if (entry.name === undefined) {
      if (entries.length > 1) {
        throw new Error(
          `[nestbridge] App #${index + 1} needs a \`name\` because several apps are configured.`,
        );
      }

      return;
    }

    if (!NAME_PATTERN.test(entry.name)) {
      throw new Error(
        `[nestbridge] Invalid app name "${entry.name}". Start with a letter and use only letters, digits, "-" and "_".`,
      );
    }

    if (seenNames.has(entry.name)) {
      throw new Error(
        `[nestbridge] Duplicate app name "${entry.name}". Each app needs its own name.`,
      );
    }

    seenNames.add(entry.name);
  });
};
