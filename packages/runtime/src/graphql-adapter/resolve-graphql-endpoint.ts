import type { NestBridgeConfig } from '../config';

const isAbsoluteUrl = (value: string) => /^[a-z][a-z\d+.-]*:\/\//i.test(value);

export const resolveGraphqlEndpoint = (config: NestBridgeConfig) => {
  const endpoint = config.graphqlEndpoint ?? `${config.baseURL ?? ''}/graphql`;

  if (isAbsoluteUrl(endpoint) || typeof globalThis.location === 'undefined') {
    return endpoint;
  }

  return new URL(endpoint, globalThis.location.origin).toString();
};
