import { BooksResolver } from '@server/books/books.resolver';
import { configureNestBridge } from 'nestbridge';

configureNestBridge({ baseURL: '/api' });

const booksResolver = new BooksResolver();

const render = (text: string) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app !== null) {
    app.textContent = text;
  }
};

const run = async () => {
  const book = await booksResolver.findOne('1');
  const created = await booksResolver.create('Foundation');

  render(`found: ${book.title} (${book.id}) / created: ${created.title} (${created.id})`);
};

void run();
