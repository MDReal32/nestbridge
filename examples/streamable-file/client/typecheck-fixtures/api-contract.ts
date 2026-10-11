import { FilesController } from '@server/files/files.controller';

const files = new FilesController();

const result = await files.download('42');
const _size: number = result.size;
const _text: string = await result.text();

// @ts-expect-error - number is not assignable to the "id" parameter's string type
files.download(42);

// @ts-expect-error - the generated client constructor accepts no arguments
new FilesController('unexpected-di-argument');

const pending = files.download('42');
pending.abort();
const _pendingSize: number = (await pending).size;
