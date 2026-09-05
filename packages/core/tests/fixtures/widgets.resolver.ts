import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { UsersService } from 'basic-server/src/users/users.service';
import { User } from './user.object-type';

@Resolver(() => User)
export class WidgetsResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  findOne(@Args('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Query(() => [User])
  search(@Args('name') name: string): Promise<User[]> {
    return this.usersService.search(name);
  }

  @Query('ping')
  legacyPing(): Promise<string> {
    return Promise.resolve('pong');
  }

  @Mutation(() => User, { name: 'createUser' })
  create(@Args('name') name: string): Promise<User> {
    return this.usersService.create(name);
  }

  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: exists to verify non-endpoint members are excluded
  private helperNotAnEndpoint() {
    return 'not exposed';
  }
}
