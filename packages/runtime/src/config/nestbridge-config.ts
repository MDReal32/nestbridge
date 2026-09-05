export interface NestBridgeConfig {
  baseURL?: string;
  graphqlEndpoint?: string;
  headers?:
    | Record<string, string>
    | (() => Record<string, string> | Promise<Record<string, string>>);
  fetch?: typeof globalThis.fetch;
}
