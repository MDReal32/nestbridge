import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Profile {
  @Field()
  bio: string;
}

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  profile: Profile;
}
