import { configureNestBridge } from '@nestbridge/runtime';
import { UsersController } from '@server/users/users.controller';
import { UsersResolver } from '@server/users/users.resolver';

configureNestBridge({ baseURL: '/api' });

const users = new UsersController();
const usersResolver = new UsersResolver();

const render = (text: string) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app !== null) {
    app.textContent = text;
  }
};

const run = async () => {
  const user = await users.findOne('123', true);
  const created = await users.create({ name: 'MDReal' });
  const queried = await usersResolver.findOne('123');

  render(
    `found: ${user.name} (${user.id}) / created: ${created.name} (${created.id}) / ` +
      `queried: ${queried.name} (${queried.id})`,
  );
};

void run();
