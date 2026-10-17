import { BooksResolver } from '@server/books/books.resolver';
import { ItemsController } from '@server/items/items.controller';

const items = new ItemsController();
const booksResolver = new BooksResolver();

const render = (text: string) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app !== null) {
    app.textContent = text;
  }
};

const run = async () => {
  const item = await items.findOne('1');
  const mine = await items.findMine();
  const book = await booksResolver.findOne('1');

  render(`item: ${item.label} / mine: ${mine.id} / book: ${book.title}`);
};

void run();
