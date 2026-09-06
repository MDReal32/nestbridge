import { FilesController } from '@server/files/files.controller';
import { configureNestBridge } from 'nestbridge';

configureNestBridge({ baseURL: '/api' });

const files = new FilesController();

const render = (text: string) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app !== null) {
    app.textContent = text;
  }
};

const run = async () => {
  const file = await files.download('42');
  const text = await file.text();

  render(`downloaded ${file.size} byte(s): ${text}`);
};

void run();
