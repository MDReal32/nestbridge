export interface NestBridgeGraphqlRequest {
  document: string;
  variables?: Record<string, unknown>;
}
