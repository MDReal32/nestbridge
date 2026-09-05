import { getNestBridgeConfig } from '../config';
import { buildRequestUrl } from './build-request-url';
import { NestBridgeError } from './nestbridge-error';
import type { NestBridgeRequest } from './nestbridge-request';
import { parseResponseBody } from './parse-response-body';
import { resolveRequestHeaders } from './resolve-request-headers';

export const request = async <T>(nestBridgeRequest: NestBridgeRequest) => {
  const config = getNestBridgeConfig();
  const fetchImplementation = config.fetch ?? globalThis.fetch;
  const hasBody = nestBridgeRequest.body !== undefined;
  const url = buildRequestUrl(config.baseURL, nestBridgeRequest.path, nestBridgeRequest.query);
  const headers = await resolveRequestHeaders(config, nestBridgeRequest.headers, hasBody);

  const response = await fetchImplementation(url, {
    method: nestBridgeRequest.method,
    headers,
    body: hasBody ? JSON.stringify(nestBridgeRequest.body) : undefined,
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new NestBridgeError(
      `NestBridge request to ${url} failed with status ${response.status}.`,
      response.status,
      responseBody,
      response,
    );
  }

  return responseBody as T;
};
