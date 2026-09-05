import type { ClientError } from 'graphql-request';

export const extractGraphqlErrorMessage = (
  response: ClientError['response'],
): string | undefined => {
  if (response.errors !== undefined && response.errors.length > 0) {
    return response.errors.map((error) => error.message).join(', ');
  }

  if (typeof response.body === 'string' && response.body.length > 0) {
    return response.body;
  }

  return undefined;
};
