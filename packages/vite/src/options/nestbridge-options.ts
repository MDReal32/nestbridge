export interface NestBridgeOptions {
  controllers: string | string[];
  baseURL?: string;
  debug?: boolean;
  outputDir?: string;
}

export interface ResolvedNestBridgeOptions {
  controllers: string[];
  baseURL: string | undefined;
  debug: boolean;
  outputDir: string;
}

export const resolveNestBridgeOptions = (options: NestBridgeOptions) => ({
  controllers: Array.isArray(options.controllers) ? options.controllers : [options.controllers],
  baseURL: options.baseURL,
  debug: options.debug ?? false,
  outputDir: options.outputDir ?? '.nestbridge',
});
