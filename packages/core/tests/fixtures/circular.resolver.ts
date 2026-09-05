import { Query, Resolver } from '@nestjs/graphql';
import { NodeA } from './circular.object-type';

@Resolver()
export class CircularResolver {
  @Query(() => NodeA)
  root(): Promise<NodeA> {
    return Promise.resolve({} as NodeA);
  }
}
