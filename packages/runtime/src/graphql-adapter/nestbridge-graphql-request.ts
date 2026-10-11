export interface NestBridgeGraphqlRequest {
  document: string;
  variables?: Record<string, unknown>;
  /**
   * The `name` of the server app that owns this operation. Selects the origin
   * the request is sent to when the plugin is configured with several apps.
   */
  service?: string;
}
