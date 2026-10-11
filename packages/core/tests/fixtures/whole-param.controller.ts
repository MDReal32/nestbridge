import { Controller, Get, Param } from '@nestjs/common';

interface PostParams {
  userId: string;
  slug: string;
}

@Controller('users/:userId')
export class WholeParamController {
  @Get('posts/:slug')
  findPost(@Param() params: PostParams): Promise<string> {
    return Promise.resolve(`${params.userId}/${params.slug}`);
  }

  @Get('drafts/:slug')
  findDraft(@Param('userId') userId: string, @Param() params: PostParams): Promise<string> {
    return Promise.resolve(`${userId}/${params.slug}`);
  }
}
