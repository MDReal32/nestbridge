import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BookType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  title!: string;
}
