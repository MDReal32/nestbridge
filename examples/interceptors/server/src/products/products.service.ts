import { Injectable } from '@nestjs/common';
import type { CreateProductDto, ProductDto } from './product.dto';

@Injectable()
export class ProductsService {
  private readonly products: ProductDto[] = [
    { id: '1', name: 'Desk lamp', priceCents: 2400 },
    { id: '2', name: 'Notebook', priceCents: 650 },
  ];

  findAll() {
    return this.products;
  }

  findOne(id: string) {
    return (
      this.products.find((candidate) => candidate.id === id) ?? {
        id,
        name: 'Unknown',
        priceCents: 0,
      }
    );
  }

  create(body: CreateProductDto) {
    const product: ProductDto = {
      id: String(this.products.length + 1),
      name: body.name,
      priceCents: body.priceCents,
    };
    this.products.push(product);
    return product;
  }
}
