import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

@Controller('users')
export class UnsupportedParamArgumentController {
  @Get(':id')
  findOne(@Param(ParseIntPipe) params: number): Promise<number> {
    return Promise.resolve(params);
  }
}
