import { EventsController } from '@events/events/events.controller';
import { BooksResolver } from '@server/books/books.resolver';

const booksResolver = new BooksResolver();

const result = await booksResolver.findOne('1');
const _title: string = result.title;

// @ts-expect-error - number is not assignable to the "id" argument's string type
booksResolver.findOne(1);

// @ts-expect-error - the generated client constructor accepts no arguments
new BooksResolver('unexpected-di-argument');

const pending = booksResolver.findOne('1');
pending.abort();
const _pendingTitle: string = (await pending).title;

const events = new EventsController();

const latestEvent = await events.latest('42');
const _eventMessage: string = latestEvent.message;

// @ts-expect-error - number is not assignable to the "id" parameter's string type
events.latest(42);
