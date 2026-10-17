import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BookType } from './book.object-type';
import { BooksService } from './books.service';

@Resolver(() => BookType)
export class BooksResolver {
  constructor(@Inject(BooksService) private readonly booksService: BooksService) {}

  @Query(() => BookType)
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.booksService.findOne(id);
  }

  @Mutation(() => BookType, { name: 'createBook' })
  create(@Args('title', { type: () => String }) title: string) {
    return this.booksService.create({ title });
  }
}
