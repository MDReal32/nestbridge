import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  name!: string;
}
