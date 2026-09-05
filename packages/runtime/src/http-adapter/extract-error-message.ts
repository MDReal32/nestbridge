export const extractErrorMessage = (body: unknown): string | undefined => {
  if (typeof body === 'string') {
    return body.length > 0 ? body : undefined;
  }

  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body as { message: unknown };

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(', ');
    }
  }

  if (typeof body === 'object' && body !== null) {
    return JSON.stringify(body);
  }

  return undefined;
};
