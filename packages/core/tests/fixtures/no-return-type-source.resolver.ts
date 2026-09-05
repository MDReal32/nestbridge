import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class NoReturnTypeSourceResolver {
  @Query('ping')
  ping() {
    return Promise.resolve('pong');
  }
}
