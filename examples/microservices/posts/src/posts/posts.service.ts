import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UsersController } from '@users/users/users.controller';
import type { Post } from './post';
import type { PostDraft } from './post-draft';
import type { PublishedPost } from './published-post';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly posts: Post[] = [];

  constructor(@Inject(UsersController) private readonly users: UsersController) {}

  async publish(draft: PostDraft) {
    const author = await this.users.findOne(draft.authorId);

    if (!author) {
      throw new RpcException(`User "${draft.authorId}" does not exist.`);
    }

    const post: Post = { id: String(this.posts.length + 1), ...draft };
    this.posts.push(post);
    await this.users.recordPost({ authorId: author.id, postId: post.id });

    this.logger.log(`Published post ${post.id} by ${author.name}`);

    const published: PublishedPost = { ...post, authorName: author.name };
    return published;
  }

  findByAuthor(authorId: string) {
    return this.posts.filter((post) => post.authorId === authorId);
  }
}
