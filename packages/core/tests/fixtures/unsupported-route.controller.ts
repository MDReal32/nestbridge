import { Controller, Get, Param } from '@nestjs/common';

function createRoute() {
  return ':id';
}

@Controller('users')
export class UnsupportedRouteController {
  @Get(createRoute())
  findOne(@Param('id') id: string): Promise<string> {
    return Promise.resolve(id);
  }
}
