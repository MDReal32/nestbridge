import { Body, Controller, Get, Inject, Param, Post, UseInterceptors } from '@nestjs/common';
import { TimingInterceptor } from '../timing.interceptor';
import type { CreateProductDto } from './product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @UseInterceptors(TimingInterceptor)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }
}
