import { Controller, Get } from '@nestjs/common';
import { UseInterceptors } from './local-decorators';
import { ClassOneInterceptor } from './wrapping.interceptors';

@Controller('local')
export class LocalDecoratorController {
  @Get()
  @UseInterceptors(ClassOneInterceptor)
  list() {
    return [1];
  }
}
