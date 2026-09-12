import { describe, expect, it } from 'vitest';
import { isNestBridgeError, NestBridgeError } from '../src/http-adapter';

describe('isNestBridgeError', () => {
  it('returns true for a NestBridgeError instance', () => {
    const error = new NestBridgeError('Not Found', 404, { message: 'Not Found' }, new Response());

    expect(isNestBridgeError(error)).toBe(true);
  });

  it('returns false for a plain Error', () => {
    expect(isNestBridgeError(new Error('boom'))).toBe(false);
  });

  it('returns false for a non-error value', () => {
    expect(isNestBridgeError({ message: 'Not Found' })).toBe(false);
  });

  it('narrows the body type when the caller supplies a type argument', () => {
    interface KnownErrorBody {
      statusCode: number;
      message: string;
    }

    const body: KnownErrorBody = { statusCode: 404, message: 'Not Found' };
    const error: unknown = new NestBridgeError('Not Found', 404, body, new Response());

    if (isNestBridgeError<KnownErrorBody>(error)) {
      expect(error.body.statusCode).toBe(404);
      expect(error.body.message).toBe('Not Found');
    } else {
      expect.unreachable();
    }
  });
});
