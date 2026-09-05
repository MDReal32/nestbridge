import { configureNestBridge } from '@nestbridge/runtime';
import { UsersController } from '@server/users/users.controller';

configureNestBridge({ baseURL: '/api' });

const users = new UsersController();

const render = (text: string) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app !== null) {
    app.textContent = text;
  }
};

const run = async () => {
  const user = await users.findOne('123', true);
  const created = await users.create({ name: 'MDReal' });

  render(`found: ${user.name} (${user.id}) / created: ${created.name} (${created.id})`);
};

void run();
