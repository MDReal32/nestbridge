import { ItemsController } from '@server/items/items.controller';

const items = new ItemsController();

const result = await items.findOne('1');
const _label: string = result.label;

// @ts-expect-error - number is not assignable to the "id" parameter's string type
items.findOne(1);

// @ts-expect-error - the generated client constructor accepts no arguments
new ItemsController('unexpected-di-argument');
