import { EventsController } from '@events/events/events.controller';
import { BooksResolver } from '@server/books/books.resolver';

const booksResolver = new BooksResolver();
const events = new EventsController();

const render = (text: string) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app !== null) {
    app.textContent = text;
  }
};

const run = async () => {
  const book = await booksResolver.findOne('1');
  const created = await booksResolver.create('Foundation');
  const event = await events.latest('42');

  render(
    `found: ${book.title} (${book.id}) / created: ${created.title} (${created.id}) / latest event: ${event.message}`,
  );
};

void run();
