export class NestBridgeError<T = unknown> extends Error {
  readonly status: number;
  readonly body: T;
  readonly response: Response;

  constructor(message: string, status: number, body: T, response: Response) {
    super(message);
    this.name = 'NestBridgeError';
    this.status = status;
    this.body = body;
    this.response = response;
  }
}
