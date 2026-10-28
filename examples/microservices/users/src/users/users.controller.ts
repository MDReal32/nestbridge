import { Controller, Inject } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import type { PostPublished } from './post-published';
import { USER_PATTERNS } from './user-patterns';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @MessagePattern(USER_PATTERNS.findOne)
  findOne(@Payload() id: string) {
    return this.usersService.findOne(id);
  }

  @EventPattern(USER_PATTERNS.postPublished)
  recordPost(@Payload() event: PostPublished) {
    this.usersService.recordPost(event);
  }
}
