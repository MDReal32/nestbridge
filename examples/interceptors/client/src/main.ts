import { ProductsController } from '@server/products/products.controller';
import { renderResponse } from './render-response';

const products = new ProductsController();

const run = async () => {
  const all = await products.findAll();
  renderResponse('GET /products', `length = ${all.data.length}`, all);

  const found = await products.findOne('1');
  renderResponse('GET /products/1', `name = ${found.data.value.name}`, found);

  const created = await products.create({ name: 'Mug', priceCents: 900 });
  renderResponse('POST /products', `name = ${created.data.name}`, created);
};

void run();
