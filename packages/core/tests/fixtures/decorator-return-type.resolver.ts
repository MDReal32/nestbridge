import { Args, Query, Resolver } from '@nestjs/graphql';
import { User } from './user.object-type';

@Resolver(() => User)
export class DecoratorReturnTypeResolver {
  @Query(() => User)
  findOne(@Args('id') id: string) {
    return Promise.resolve({ id, name: 'MDReal' });
  }

  @Query(() => String)
  ping() {
    return Promise.resolve('pong');
  }
}
