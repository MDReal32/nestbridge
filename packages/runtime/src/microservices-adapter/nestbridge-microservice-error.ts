export class NestBridgeMicroserviceError extends Error {
  readonly service: string;

  constructor(message: string, service: string) {
    super(message);
    this.name = 'NestBridgeMicroserviceError';
    this.service = service;
  }
}
