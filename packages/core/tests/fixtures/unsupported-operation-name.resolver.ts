import { Query, Resolver } from '@nestjs/graphql';

function createName() {
  return 'ping';
}

@Resolver()
export class UnsupportedOperationNameResolver {
  @Query(createName())
  ping(): Promise<string> {
    return Promise.resolve('pong');
  }
}
