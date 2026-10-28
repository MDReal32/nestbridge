import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { PostDraft } from './post-draft';
import { POST_PATTERNS } from './post-patterns';
import { PostsService } from './posts.service';

@Controller()
export class PostsController {
  constructor(@Inject(PostsService) private readonly postsService: PostsService) {}

  @MessagePattern(POST_PATTERNS.publish)
  publish(@Payload() draft: PostDraft) {
    return this.postsService.publish(draft);
  }

  @MessagePattern(POST_PATTERNS.findByAuthor)
  findByAuthor(@Payload() authorId: string) {
    return this.postsService.findByAuthor(authorId);
  }
}
