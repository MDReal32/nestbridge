import { Module } from '@nestjs/common';
import { UsersController } from '@users/users/users.controller';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, UsersController],
})
export class PostsModule {}
