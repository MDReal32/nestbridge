export interface NestBridgeConfig {
  /**
   * A single endpoint for every GraphQL request, or one endpoint per service
   * name. A service without an entry uses its origin plus `/graphql`.
   */
  graphqlEndpoint?: string | Record<string, string>;
  /**
   * Origins keyed by the `name` of a server app in the plugin options.
   * Takes precedence over the `baseURL` the plugin registered for that app.
   */
  services?: Record<string, string>;
  headers?:
    | Record<string, string>
    | (() => Record<string, string> | Promise<Record<string, string>>);
  fetch?: typeof globalThis.fetch;
}
