import { LOG_LEVEL_RANKS, type NestBridgeLogLevel } from '../options';

export const mostVerboseLogLevel = (levels: readonly (NestBridgeLogLevel | undefined)[]) =>
  levels.reduce<NestBridgeLogLevel | undefined>((mostVerbose, level) => {
    if (mostVerbose === undefined || level === undefined) {
      return undefined;
    }

    return LOG_LEVEL_RANKS[level] > LOG_LEVEL_RANKS[mostVerbose] ? level : mostVerbose;
  }, 'silent');
