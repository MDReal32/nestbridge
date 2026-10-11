import type { NestBridgeConfig } from '../config';
import { resolveBaseURL } from '../config';

const isAbsoluteUrl = (value: string) => /^[a-z][a-z\d+.-]*:\/\//i.test(value);

const configuredEndpoint = (config: NestBridgeConfig, service: string | undefined) => {
  if (typeof config.graphqlEndpoint === 'string') {
    return config.graphqlEndpoint;
  }

  return service === undefined ? undefined : config.graphqlEndpoint?.[service];
};

export const resolveGraphqlEndpoint = (
  config: NestBridgeConfig,
  service: string | undefined,
): string => {
  const endpoint =
    configuredEndpoint(config, service) ?? `${resolveBaseURL(service) ?? ''}/graphql`;

  if (isAbsoluteUrl(endpoint) || typeof globalThis.location === 'undefined') {
    return endpoint;
  }

  return new URL(endpoint, globalThis.location.origin).toString();
};
