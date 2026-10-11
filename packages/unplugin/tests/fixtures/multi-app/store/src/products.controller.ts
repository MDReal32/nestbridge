import { Controller, Get } from '@nestjs/common';

@Controller('products')
export class ProductsController {
  @Get()
  list(): Promise<string[]> {
    throw new Error('not implemented');
  }
}
