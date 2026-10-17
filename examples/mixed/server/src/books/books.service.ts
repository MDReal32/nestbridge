import { Injectable } from '@nestjs/common';
import type { BookDto, CreateBookDto } from './book.dto';

@Injectable()
export class BooksService {
  private readonly books: BookDto[] = [{ id: '1', title: 'Dune' }];

  findOne(id: string) {
    const book = this.books.find((candidate) => candidate.id === id) ?? { id, title: 'Unknown' };
    return Promise.resolve(book);
  }

  create(body: CreateBookDto) {
    const book: BookDto = { id: String(this.books.length + 1), title: body.title };
    this.books.push(book);
    return Promise.resolve(book);
  }
}
