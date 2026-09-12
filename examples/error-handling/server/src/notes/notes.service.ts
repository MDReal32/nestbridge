import { Injectable } from '@nestjs/common';
import type { CreateNoteDto, NoteDto } from './note.dto';

@Injectable()
export class NotesService {
  private readonly notes: NoteDto[] = [{ id: '1', title: 'First note' }];

  findOne(id: string) {
    const note = this.notes.find((candidate) => candidate.id === id);
    return Promise.resolve(note);
  }

  create(body: CreateNoteDto) {
    const note: NoteDto = { id: String(this.notes.length + 1), title: body.title };
    this.notes.push(note);
    return Promise.resolve(note);
  }
}
