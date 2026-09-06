import { ItemsController } from '@server/items/items.controller';
import { configureNestBridge } from 'nestbridge';

configureNestBridge({ baseURL: '/api' });

const items = new ItemsController();

const render = (text: string) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app !== null) {
    app.textContent = text;
  }
};

const run = async () => {
  const item = await items.findOne('1');
  const created = await items.create({ label: 'Second item' });

  render(`found: ${item.label} (${item.id}) / created: ${created.label} (${created.id})`);
};

void run();
