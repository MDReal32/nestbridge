import type { BundlerLogger } from './bundler-logger';

export const reportMessages = (
  messages: readonly string[],
  watchMode: boolean | undefined,
  logger: Pick<BundlerLogger, 'warn'>,
) => {
  for (const message of messages) {
    if (watchMode === false) {
      throw new Error(message);
    }

    logger.warn(message);
  }
};
