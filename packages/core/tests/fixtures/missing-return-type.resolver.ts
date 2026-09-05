import { Args, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class MissingReturnTypeResolver {
  @Query(() => String)
  echo(@Args('value') value: string) {
    return Promise.resolve(value);
  }
}
