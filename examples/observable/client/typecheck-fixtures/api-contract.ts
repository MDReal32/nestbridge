import { EventsController } from '@server/events/events.controller';

const events = new EventsController();

const result = await events.latest('42');
const _message: string = result.message;

// @ts-expect-error - number is not assignable to the "id" parameter's string type
events.latest(42);

// @ts-expect-error - the generated client constructor accepts no arguments
new EventsController('unexpected-di-argument');
