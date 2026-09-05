import { getNestBridgeConfig } from '../config';
import { buildRequestUrl } from './build-request-url';
import { extractErrorMessage } from './extract-error-message';
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

  if (!response.ok) {
    const responseBody = await parseResponseBody(response);
    const backendMessage = extractErrorMessage(responseBody);
    const message = `NestBridge request to ${url} failed with status ${response.status}.${
      backendMessage === undefined ? '' : ` ${backendMessage}`
    }`;

    throw new NestBridgeError(message, response.status, responseBody, response);
  }

  if (nestBridgeRequest.responseType === 'blob') {
    return (await response.blob()) as T;
  }

  return (await parseResponseBody(response)) as T;
};
