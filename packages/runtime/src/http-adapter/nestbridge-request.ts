export interface NestBridgeRequest {
  method: string;
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string | undefined>;
  responseType?: 'json' | 'blob';
}
