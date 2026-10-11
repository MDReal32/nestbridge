import { Controller, Get } from '@nestjs/common';

@Controller('ping')
export class PingController {
  @Get()
  ping(): Promise<string> {
    throw new Error('not implemented');
  }
}
