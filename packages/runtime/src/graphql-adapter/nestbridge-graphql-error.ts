import type { ClientError } from 'graphql-request';

import { extractGraphqlErrorMessage } from './extract-graphql-error-message';

export class NestBridgeGraphqlError extends Error {
  readonly status: number;
  readonly errors: ClientError['response']['errors'];
  readonly data: ClientError['response']['data'];
  readonly request: ClientError['request'];

  constructor(clientError: ClientError, endpoint: string) {
    const backendMessage = extractGraphqlErrorMessage(clientError.response);
    const message = `NestBridge GraphQL request to ${endpoint} failed with status ${
      clientError.response.status
    }.${backendMessage === undefined ? '' : ` ${backendMessage}`}`;

    super(message);
    this.name = 'NestBridgeGraphqlError';
    this.status = clientError.response.status;
    this.errors = clientError.response.errors;
    this.data = clientError.response.data;
    this.request = clientError.request;
  }
}
