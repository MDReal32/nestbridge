import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class UnsupportedArgumentResolver {
  @Query(() => String)
  echo(value: string): Promise<string> {
    return Promise.resolve(value);
  }
}
