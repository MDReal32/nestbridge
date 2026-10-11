import { Controller, Get, Version } from '@nestjs/common';
import { CURRENT_VERSION } from './versions';

@Controller('users')
export class UsersController {
  @Version(CURRENT_VERSION)
  @Get()
  list() {
    return [];
  }
}
