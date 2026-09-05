import { UsersController } from '@server/users/users.controller';

const users = new UsersController();

const result = await users.findOne('123');
const _name: string = result.name;

// @ts-expect-error - number is not assignable to the "id" parameter's string type
users.findOne(123);

// @ts-expect-error - the generated client constructor accepts no arguments
new UsersController('unexpected-di-argument');
