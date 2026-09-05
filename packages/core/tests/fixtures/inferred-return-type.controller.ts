import { Controller, Get, Param } from '@nestjs/common';

@Controller('users')
export class InferredReturnTypeController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    return {
      id,
      name: 'John',
      settings: {
        theme: 'dark' as const,
      },
    };
  }
}
