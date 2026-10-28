import { Injectable, Logger } from '@nestjs/common';
import type { PostPublished } from './post-published';
import type { User } from './user';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private readonly users = new Map<string, User>([
    ['1', { id: '1', name: 'Ada Lovelace', postCount: 0 }],
    ['2', { id: '2', name: 'Alan Turing', postCount: 0 }],
  ]);

  findOne(id: string) {
    this.logger.log(`findOne(${id}) asked over TCP`);
    return this.users.get(id) ?? null;
  }

  recordPost(event: PostPublished) {
    const author = this.users.get(event.authorId);

    if (!author) {
      return;
    }

    author.postCount += 1;
    this.logger.log(`${author.name} now has ${author.postCount} post(s); post ${event.postId}`);
  }
}
