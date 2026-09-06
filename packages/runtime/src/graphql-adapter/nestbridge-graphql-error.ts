import {
  extractGraphqlErrorMessage,
  type GraphqlErrorResponse,
} from './extract-graphql-error-message';

export class NestBridgeGraphqlError extends Error {
  readonly status: number;
  readonly errors: GraphqlErrorResponse['errors'];
  readonly data: GraphqlErrorResponse['data'];

  constructor(response: GraphqlErrorResponse, endpoint: string) {
    const backendMessage = extractGraphqlErrorMessage(response);
    const message = `NestBridge GraphQL request to ${endpoint} failed with status ${
      response.status
    }.${backendMessage === undefined ? '' : ` ${backendMessage}`}`;

    super(message);
    this.name = 'NestBridgeGraphqlError';
    this.status = response.status;
    this.errors = response.errors;
    this.data = response.data;
  }
}
