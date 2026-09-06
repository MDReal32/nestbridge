import { EventsController } from '@server/events/events.controller';

const events = new EventsController();

const render = (text: string) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app !== null) {
    app.textContent = text;
  }
};

const run = async () => {
  const event = await events.latest('42');

  render(`latest event ${event.id}: ${event.message}`);
};

void run();
