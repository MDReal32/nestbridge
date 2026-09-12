import { isNestBridgeError } from '@nestbridge/runtime';
import { NotesController } from '@server/notes/notes.controller';
import type { NestBridgeErrorBody } from '../.nestbridge/nestbridge-error-body';

const notes = new NotesController();

const render = (text: string) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app !== null) {
    app.textContent = text;
  }
};

const run = async () => {
  const created = await notes.create({ title: 'Second note' });
  const lines = [
    `created: ${created.data.data.title} (${created.data.data.id}) [request ${created.meta.requestId}]`,
  ];

  try {
    await notes.findOne('missing');
  } catch (error) {
    if (!isNestBridgeError<NestBridgeErrorBody>(error)) {
      throw error;
    }

    lines.push(`error ${error.body.statusCode}: ${error.body.message}`);
  }

  render(lines.join(' / '));
};

void run();
