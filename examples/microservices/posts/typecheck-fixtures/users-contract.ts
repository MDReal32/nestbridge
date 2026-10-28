import { UsersController } from '@users/users/users.controller';

const users = new UsersController();

const author = await users.findOne('1');
const _name: string | undefined = author?.name;

await users.recordPost({ authorId: '1', postId: '1' });

// @ts-expect-error - findOne resolves with the handler's User | null, not any
const _wrongAuthor: string = await users.findOne('1');

// @ts-expect-error - the payload of findOne is the user id string
users.findOne(1);

// @ts-expect-error - the payload of recordPost must be a PostPublished
users.recordPost({ authorId: '1' });
