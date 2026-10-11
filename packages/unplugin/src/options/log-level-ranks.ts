import type { NestBridgeLogLevel } from './nestbridge-log-level';

export const LOG_LEVEL_RANKS: Record<NestBridgeLogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
};
