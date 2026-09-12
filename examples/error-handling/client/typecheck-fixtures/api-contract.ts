import { isNestBridgeError } from '@nestbridge/runtime';
import { NotesController } from '@server/notes/notes.controller';
import type { NestBridgeErrorBody } from '../.nestbridge/nestbridge-error-body';

const notes = new NotesController();

const created = await notes.create({ title: 'First note' });
const _title: string = created.data.data.title;
const _requestId: string = created.meta.requestId;

// @ts-expect-error - number is not assignable to the "id" parameter's string type
notes.findOne(1);

// @ts-expect-error - the generated client constructor accepts no arguments
new NotesController('unexpected-di-argument');

declare const unknownError: unknown;

if (isNestBridgeError<NestBridgeErrorBody>(unknownError)) {
  const _statusCode: number = unknownError.body.statusCode;
  const _message: string = unknownError.body.message;
}
