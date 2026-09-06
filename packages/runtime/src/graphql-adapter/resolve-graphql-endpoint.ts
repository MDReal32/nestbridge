import type { NestBridgeConfig } from '../config';
import { getNestBridgeBaseURL } from '../config';

const isAbsoluteUrl = (value: string) => /^[a-z][a-z\d+.-]*:\/\//i.test(value);

export const resolveGraphqlEndpoint = (config: NestBridgeConfig): string => {
  const endpoint = config.graphqlEndpoint ?? `${getNestBridgeBaseURL() ?? ''}/graphql`;

  if (isAbsoluteUrl(endpoint) || typeof globalThis.location === 'undefined') {
    return endpoint;
  }

  return new URL(endpoint, globalThis.location.origin).toString();
};
