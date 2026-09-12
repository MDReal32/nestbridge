import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class BranchingExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception.getStatus() === 404) {
      response.json({ message: 'not found' });
    } else {
      response.json({ message: exception.message });
    }
  }
}
