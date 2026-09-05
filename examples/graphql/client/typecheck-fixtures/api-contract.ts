import { BooksResolver } from '@server/books/books.resolver';

const booksResolver = new BooksResolver();

const result = await booksResolver.findOne('1');
const _title: string = result.title;

// @ts-expect-error - number is not assignable to the "id" argument's string type
booksResolver.findOne(1);

// @ts-expect-error - the generated client constructor accepts no arguments
new BooksResolver('unexpected-di-argument');
