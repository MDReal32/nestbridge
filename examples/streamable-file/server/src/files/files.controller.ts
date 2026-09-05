import type { StreamableFile } from '@nestjs/common';
import { Controller, Get, Inject, Param } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(@Inject(FilesService) private readonly filesService: FilesService) {}

  @Get(':id/download')
  download(@Param('id') id: string): StreamableFile {
    return this.filesService.download(id);
  }
}
