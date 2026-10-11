import { LOG_LEVEL_RANKS, type NestBridgeLogLevel } from '../options';
import type { BundlerLogger } from './bundler-logger';

export const createLevelLogger = (level: NestBridgeLogLevel | undefined, logger: BundlerLogger) => {
  const rank = LOG_LEVEL_RANKS[level ?? 'info'];

  return {
    info: (message) => {
      if (rank >= LOG_LEVEL_RANKS.info) {
        logger.info(message);
      }
    },
    warn: (message) => {
      if (rank >= LOG_LEVEL_RANKS.warn) {
        logger.warn(message);
      }
    },
  } satisfies BundlerLogger;
};
