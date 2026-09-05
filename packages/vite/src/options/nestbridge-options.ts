export interface NestBridgeOptions {
  controllers: string | string[];
  resolvers?: string | string[];
  baseURL?: string;
  debug?: boolean;
  outputDir?: string;
}

export interface ResolvedNestBridgeOptions {
  controllers: string[];
  resolvers: string[];
  baseURL: string | undefined;
  debug: boolean;
  outputDir: string;
}

export const resolveNestBridgeOptions = (options: NestBridgeOptions) => ({
  controllers: Array.isArray(options.controllers) ? options.controllers : [options.controllers],
  resolvers:
    options.resolvers === undefined
      ? []
      : Array.isArray(options.resolvers)
        ? options.resolvers
        : [options.resolvers],
  baseURL: options.baseURL,
  debug: options.debug ?? false,
  outputDir: options.outputDir ?? '.nestbridge',
});
