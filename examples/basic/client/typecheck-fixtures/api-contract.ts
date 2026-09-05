import { UsersController } from '@server/users/users.controller';
import { UsersResolver } from '@server/users/users.resolver';

const users = new UsersController();

const result = await users.findOne('123');
const _name: string = result.name;

// @ts-expect-error - number is not assignable to the "id" parameter's string type
users.findOne(123);

// @ts-expect-error - the generated client constructor accepts no arguments
new UsersController('unexpected-di-argument');

const usersResolver = new UsersResolver();

const queried = await usersResolver.findOne('123');
const _queriedName: string = queried.name;

// @ts-expect-error - number is not assignable to the "id" argument's string type
usersResolver.findOne(123);

// @ts-expect-error - the generated client constructor accepts no arguments
new UsersResolver('unexpected-di-argument');
