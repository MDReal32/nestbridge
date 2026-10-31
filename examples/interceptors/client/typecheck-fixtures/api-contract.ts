import { ProductsController } from '@server/products/products.controller';

const products = new ProductsController();

const all = await products.findAll();
const _firstName: string | undefined = all.data[0]?.name;
const _version: number = all.meta.version;

const found = await products.findOne('1');
const _foundPrice: number = found.data.value.priceCents;
const _tookMs: number = found.data.tookMs;

const created = await products.create({ name: 'Mug', priceCents: 900 });
const _createdName: string = created.data.name;

// @ts-expect-error - the generated client constructor accepts no arguments
new ProductsController('unexpected-di-argument');

// @ts-expect-error - number is not assignable to the "id" parameter's string type
products.findOne(1);

// @ts-expect-error - the response is wrapped by the interceptors, it is not the bare product
const _bareName: string = found.name;

const pending = products.findOne('1');
pending.abort();
