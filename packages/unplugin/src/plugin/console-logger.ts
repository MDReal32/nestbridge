import type { BundlerLogger } from './bundler-logger';

export const consoleLogger: BundlerLogger = {
  info: (message) => console.log(message),
  warn: (message) => console.warn(message),
};
