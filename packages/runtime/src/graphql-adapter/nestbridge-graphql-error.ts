import type { ClientError } from 'graphql-request';

export class NestBridgeGraphqlError extends Error {
  readonly status: number;
  readonly errors: ClientError['response']['errors'];
  readonly data: ClientError['response']['data'];
  readonly request: ClientError['request'];

  constructor(clientError: ClientError) {
    super(clientError.message);
    this.name = 'NestBridgeGraphqlError';
    this.status = clientError.response.status;
    this.errors = clientError.response.errors;
    this.data = clientError.response.data;
    this.request = clientError.request;
  }
}
