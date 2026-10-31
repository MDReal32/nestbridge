import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { BottomInterceptor, TopInterceptor } from './wrapping.interceptors';

@Controller('stacked')
export class StackedController {
  @Get()
  @UseInterceptors(TopInterceptor)
  @UseInterceptors(BottomInterceptor)
  list() {
    return [1];
  }
}
