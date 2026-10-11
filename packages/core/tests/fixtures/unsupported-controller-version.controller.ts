import { Controller, Get } from '@nestjs/common';
import { CURRENT_VERSION } from './versions';

@Controller({ path: 'users', version: CURRENT_VERSION })
export class UsersController {
  @Get()
  list() {
    return [];
  }
}
