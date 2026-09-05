import { Field, ObjectType, Query, Resolver } from '@nestjs/graphql';

class PlainProfile {
  bio: string;
}

@ObjectType()
class UserWithPlainField {
  @Field()
  id: string;

  @Field()
  profile: PlainProfile;
}

@Resolver()
export class NonObjectTypeResolver {
  @Query(() => UserWithPlainField)
  findOne(): Promise<UserWithPlainField> {
    return Promise.resolve({} as UserWithPlainField);
  }
}
