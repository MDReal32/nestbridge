import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NodeA {
  @Field()
  id: string;

  @Field()
  next: NodeB;
}

@ObjectType()
export class NodeB {
  @Field()
  id: string;

  @Field()
  next: NodeA;
}
