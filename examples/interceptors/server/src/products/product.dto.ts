export interface ProductDto {
  id: string;
  name: string;
  priceCents: number;
}

export interface CreateProductDto {
  name: string;
  priceCents: number;
}
