import { Controller, Get, UseInterceptors } from '@nestjs/common';
import {
  ClassOneInterceptor,
  ClassTwoInterceptor,
  MethodInterceptor,
} from './wrapping.interceptors';

@Controller('layered')
@UseInterceptors(ClassOneInterceptor, new ClassTwoInterceptor())
export class LayeredController {
  @Get()
  list() {
    return [1];
  }

  @Get(':id')
  @UseInterceptors(MethodInterceptor)
  findOne() {
    return 1;
  }
}
