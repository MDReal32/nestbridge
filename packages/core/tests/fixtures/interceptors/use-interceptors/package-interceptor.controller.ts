import { ClassSerializerInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';

@Controller('package')
@UseInterceptors(ClassSerializerInterceptor)
export class PackageInterceptorController {
  @Get()
  list() {
    return [1];
  }

  @Get(':id')
  findOne() {
    return 1;
  }
}
