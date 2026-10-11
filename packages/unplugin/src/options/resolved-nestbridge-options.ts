import type { GlobalPrefix, UriVersioning } from '@nestbridge/core';

export interface ResolvedNestBridgeOptions {
  name: string | undefined;
  controllers: string[];
  resolvers: string[];
  baseURL: string | undefined;
  bootstrap: string | undefined;
  globalPrefix: GlobalPrefix | false | undefined;
  versioning: UriVersioning | false | undefined;
  debug: boolean;
  outputDir: string;
  root: string | undefined;
}
