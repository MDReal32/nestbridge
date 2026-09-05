import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('users')
export class UnsupportedParameterController {
  @Get('profile')
  profile(@Req() request: Request): Promise<string> {
    return Promise.resolve(request.url);
  }
}
