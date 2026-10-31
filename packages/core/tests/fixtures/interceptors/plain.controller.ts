import { Controller, Get } from '@nestjs/common';

@Controller('plain')
export class PlainController {
  @Get()
  list() {
    return [1];
  }

  @Get(':id')
  findOne() {
    return 1;
  }
}
