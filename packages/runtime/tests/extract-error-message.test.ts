import { describe, expect, it } from 'vitest';
import { extractErrorMessage } from '../src/http-adapter/extract-error-message';

describe('extractErrorMessage', () => {
  it('returns a string body unchanged', () => {
    expect(extractErrorMessage('Not Found')).toBe('Not Found');
  });

  it('returns undefined for an empty string body', () => {
    expect(extractErrorMessage('')).toBeUndefined();
  });

  it('returns the message property from a NestJS-shaped error body', () => {
    expect(
      extractErrorMessage({ statusCode: 404, message: 'User not found', error: 'Not Found' }),
    ).toBe('User not found');
  });

  it('joins an array message into a single string', () => {
    expect(
      extractErrorMessage({
        statusCode: 400,
        message: ['name must be a string', 'name should not be empty'],
      }),
    ).toBe('name must be a string, name should not be empty');
  });

  it('serializes an object body with no message property', () => {
    expect(extractErrorMessage({ statusCode: 500, error: 'Internal Server Error' })).toBe(
      '{"statusCode":500,"error":"Internal Server Error"}',
    );
  });

  it('returns undefined for undefined body', () => {
    expect(extractErrorMessage(undefined)).toBeUndefined();
  });
});
