import { getNestBridgeConfig } from '../config';
import { parseResponseBody } from '../http-adapter/parse-response-body';
import { resolveRequestHeaders } from '../http-adapter/resolve-request-headers';
import { NestBridgeGraphqlError } from './nestbridge-graphql-error';
import type { NestBridgeGraphqlRequest } from './nestbridge-graphql-request';
import { resolveGraphqlEndpoint } from './resolve-graphql-endpoint';

interface GraphqlResponseBody<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

const isGraphqlResponseBody = <T>(body: unknown): body is GraphqlResponseBody<T> =>
  typeof body === 'object' && body !== null;

export const graphqlRequest = async <T>(
  nestBridgeGraphqlRequest: NestBridgeGraphqlRequest,
): Promise<T> => {
  const config = getNestBridgeConfig();
  const fetchImplementation = config.fetch ?? globalThis.fetch;
  const endpoint = resolveGraphqlEndpoint(config);
  const headers = await resolveRequestHeaders(config, undefined, true);

  const response = await fetchImplementation(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: nestBridgeGraphqlRequest.document,
      variables: nestBridgeGraphqlRequest.variables,
    }),
  });

  const responseBody = await parseResponseBody(response);
  const body = isGraphqlResponseBody<T>(responseBody) ? responseBody : {};

  if (!response.ok || (body.errors !== undefined && body.errors.length > 0)) {
    throw new NestBridgeGraphqlError(
      {
        status: response.status,
        headers: response.headers,
        body: typeof responseBody === 'string' ? responseBody : '',
        errors: body.errors,
        data: body.data,
      },
      endpoint,
    );
  }

  return body.data as T;
};
