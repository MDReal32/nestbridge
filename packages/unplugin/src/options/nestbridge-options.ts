import type { GlobalPrefixOption } from './global-prefix-option';
import type { NestBridgeLogLevel } from './nestbridge-log-level';
import type { VersioningOption } from './versioning-option';

export interface NestBridgeOptions {
  /**
   * Identifies the server app. Required, and unique, when several apps are
   * configured. It also names the runtime service and the declaration folder.
   */
  name?: string;
  controllers: string | string[];
  resolvers?: string | string[];
  /**
   * Also turns the controllers' `@EventPattern()` / `@MessagePattern()` handlers into client
   * methods that publish through `nestbridge/microservices`. Requires `name`, which is the service
   * the message client is looked up by. Off by default, so browser clients never receive
   * microservice code.
   */
  messagePatterns?: boolean;
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
  /**
   * How much of this app's output the plugin logs, like Vite's `logLevel`:
   * `'warn'` hides `debug` messages, `'error'` and `'silent'` hide warnings.
   * Defaults to the bundler's own level (Vite's `logLevel`, webpack's
   * `infrastructureLogging.level`). Diagnostics that fail a one-shot build are
   * thrown and unaffected.
   */
  logLevel?: NestBridgeLogLevel;
  /**
   * Where the generated declarations go. By default `.nestbridge` at the workspace root (the nearest
   * ancestor with `nx.json`, `pnpm-workspace.yaml`, `turbo.json`, `lerna.json` or a `package.json`
   * with `workspaces`), shared by every app, or in the project root when there is no workspace. An
   * explicit value is resolved from the bundler's own root and keeps the per-project layout.
   */
  outputDir?: string;
  root?: string;
}
