import { Controller, Get, Param } from '@nestjs/common';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  @Get(':id')
  findOne(@Param('id') id: string): Promise<string> {
    return this.findOneSource(id);
  }

  private findOneSource(_id: string): Promise<string> {
    throw new Error('not implemented');
  }
}
