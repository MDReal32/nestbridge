import type { GlobalPrefixOption } from './global-prefix-option';
import type { VersioningOption } from './versioning-option';

export interface NestBridgeOptions {
  /**
   * Identifies the server app. Required, and unique, when several apps are
   * configured. It also names the runtime service and the declaration folder.
   */
  name?: string;
  controllers: string | string[];
  resolvers?: string | string[];
  baseURL?: string;
  /**
   * The app's bootstrap file, relative to `root`. Skips the `main.ts` search.
   */
  bootstrap?: string;
  /**
   * Replaces what `setGlobalPrefix()` in the bootstrap file would detect.
   * `false` ignores the bootstrap file's prefix.
   */
  globalPrefix?: string | GlobalPrefixOption | false;
  /**
   * Replaces what `enableVersioning()` in the bootstrap file would detect.
   * `false` ignores the bootstrap file's versioning.
   */
  versioning?: VersioningOption | false;
  debug?: boolean;
  outputDir?: string;
  root?: string;
}
