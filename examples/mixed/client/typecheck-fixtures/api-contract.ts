import { BooksResolver } from '@server/books/books.resolver';
import { ItemsController } from '@server/items/items.controller';

const items = new ItemsController();
const booksResolver = new BooksResolver();

const item = await items.findOne('1');
const _label: string = item.label;

const mine = await items.findMine();
const _mineId: string = mine.id;

// @ts-expect-error - the server-resolved @CurrentUser() parameter is not part of the client signature
items.findMine('user-1');

// @ts-expect-error - number is not assignable to the "id" parameter's string type
items.findOne(1);

const book = await booksResolver.findOne('1');
const _title: string = book.title;

// @ts-expect-error - number is not assignable to the "id" argument's string type
booksResolver.findOne(1);
