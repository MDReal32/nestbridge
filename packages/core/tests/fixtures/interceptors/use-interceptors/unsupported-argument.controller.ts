import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { createInterceptor } from './create-interceptor';

@Controller('unsupported')
export class UnsupportedArgumentController {
  @Get()
  @UseInterceptors(createInterceptor())
  list() {
    return [1];
  }

  @Get(':id')
  findOne() {
    return 1;
  }
}
