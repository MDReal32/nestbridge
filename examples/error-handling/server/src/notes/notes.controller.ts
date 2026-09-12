import { Body, Controller, Get, Inject, NotFoundException, Param, Post } from '@nestjs/common';
import type { CreateNoteDto } from './note.dto';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(@Inject(NotesService) private readonly notesService: NotesService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const note = await this.notesService.findOne(id);

    if (note === undefined) {
      throw new NotFoundException(`Note ${id} not found`);
    }

    return note;
  }

  @Post()
  create(@Body() body: CreateNoteDto) {
    return this.notesService.create(body);
  }
}
