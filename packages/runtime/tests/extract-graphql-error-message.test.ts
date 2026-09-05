import { describe, expect, it } from 'vitest';
import { extractGraphqlErrorMessage } from '../src/graphql-adapter/extract-graphql-error-message';

describe('extractGraphqlErrorMessage', () => {
  it('joins GraphQL error messages when present', () => {
    expect(
      extractGraphqlErrorMessage({
        status: 200,
        headers: new Headers(),
        body: '',
        errors: [{ message: 'Not Found' } as never, { message: 'Forbidden' } as never],
      }),
    ).toBe('Not Found, Forbidden');
  });

  it('falls back to the raw response body when there are no GraphQL errors', () => {
    expect(
      extractGraphqlErrorMessage({
        status: 500,
        headers: new Headers(),
        body: 'Internal Server Error',
      }),
    ).toBe('Internal Server Error');
  });

  it('returns undefined when there are no errors and an empty body', () => {
    expect(
      extractGraphqlErrorMessage({
        status: 500,
        headers: new Headers(),
        body: '',
      }),
    ).toBeUndefined();
  });
});
