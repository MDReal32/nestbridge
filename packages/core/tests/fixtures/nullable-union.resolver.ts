// biome-ignore-all lint/correctness/noUnusedFunctionParameters: parameters exist only to be analysed

import { Args, Field, ObjectType, Query, Resolver } from '@nestjs/graphql';

@ObjectType()
export class NullableWidget {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  name!: string | null;

  @Field(() => String, { nullable: true })
  nickname!: null | string;

  @Field(() => String, { nullable: true })
  note!: string | null | undefined;

  @Field(() => String, { nullable: true })
  label!: string | undefined;

  @Field(() => [String], { nullable: true })
  tags!: string[] | null;
}

@Resolver(() => NullableWidget)
export class NullableWidgetsResolver {
  @Query(() => NullableWidget, { nullable: true })
  find(
    @Args('id') id: string,
    @Args('term', { nullable: true }) term: string | null,
    @Args('prefix', { nullable: true }) prefix: null | string,
    @Args('suffix', { nullable: true }) suffix: string | null | undefined,
    @Args('hint', { nullable: true }) hint: string | undefined,
    @Args('limit', { nullable: true }) limit?: number,
    @Args('offset') offset?: number,
    @Args('page', { nullable: true }) page: number = 1,
  ): Promise<NullableWidget | null> {
    return Promise.resolve(null);
  }
}
