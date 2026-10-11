import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): Promise<string> {
    throw new Error('not implemented');
  }
}
