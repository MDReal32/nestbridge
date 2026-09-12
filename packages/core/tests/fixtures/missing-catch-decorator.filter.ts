import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';

export class UndecoratedExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    response.json({ message: exception.message });
  }
}
