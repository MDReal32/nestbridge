import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserType } from './user.object-type';
import { UsersService } from './users.service';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Query(() => UserType)
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.usersService.findOne(id, true);
  }

  @Mutation(() => UserType, { name: 'createUser' })
  create(@Args('name', { type: () => String }) name: string) {
    return this.usersService.create({ name });
  }
}
