import { Controller, Get, Param } from '@nestjs/common';

@Controller('widgets')
export class WidgetsController {
  @Get(':id')
  findOne(@Param('id') id: string): Promise<string> {
    return this.findOneSource(id);
  }

  private findOneSource(_id: string): Promise<string> {
    throw new Error('not implemented');
  }
}
