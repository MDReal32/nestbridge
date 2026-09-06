export interface GraphqlErrorResponse {
  status: number;
  headers: Headers;
  body: string;
  errors?: Array<{ message: string }>;
  data?: unknown;
}

export const extractGraphqlErrorMessage = (response: GraphqlErrorResponse): string | undefined => {
  if (response.errors !== undefined && response.errors.length > 0) {
    return response.errors.map((error) => error.message).join(', ');
  }

  if (typeof response.body === 'string' && response.body.length > 0) {
    return response.body;
  }

  return undefined;
};
