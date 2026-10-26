import type { GlobalPrefix, UriVersioning } from '@nestbridge/core';
import type { NestBridgeLogLevel } from './nestbridge-log-level';

export interface ResolvedNestBridgeOptions {
  name: string | undefined;
  controllers: string[];
  resolvers: string[];
  baseURL: string | undefined;
  bootstrap: string | undefined;
  globalPrefix: GlobalPrefix | false | undefined;
  versioning: UriVersioning | false | undefined;
  debug: boolean;
  logLevel: NestBridgeLogLevel | undefined;
  outputDir: string | undefined;
  root: string | undefined;
}
