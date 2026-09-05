import { ClientError, GraphQLClient } from 'graphql-request';

import { getNestBridgeConfig } from '../config';
import { resolveRequestHeaders } from '../http-adapter/resolve-request-headers';
import { NestBridgeGraphqlError } from './nestbridge-graphql-error';
import type { NestBridgeGraphqlRequest } from './nestbridge-graphql-request';
import { resolveGraphqlEndpoint } from './resolve-graphql-endpoint';

export const graphqlRequest = async <T>(nestBridgeGraphqlRequest: NestBridgeGraphqlRequest) => {
  const config = getNestBridgeConfig();
  const endpoint = resolveGraphqlEndpoint(config);
  const headers = await resolveRequestHeaders(config, undefined, false);
  const client = new GraphQLClient(endpoint, { fetch: config.fetch, headers });

  try {
    return await client.request<T>(
      nestBridgeGraphqlRequest.document,
      nestBridgeGraphqlRequest.variables,
    );
  } catch (error) {
    if (error instanceof ClientError) {
      throw new NestBridgeGraphqlError(error);
    }

    throw error;
  }
};
