import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserType } from './user.object-type';
import type { UsersService } from './users.service';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserType)
  findOne(@Args('id') id: string): Promise<UserType> {
    return this.usersService.findOne(id);
  }
}
