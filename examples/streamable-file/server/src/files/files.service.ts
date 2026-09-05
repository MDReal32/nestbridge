import { Injectable, StreamableFile } from '@nestjs/common';

@Injectable()
export class FilesService {
  download(id: string): StreamableFile {
    const contents = Buffer.from(`contents of file ${id}\n`, 'utf-8');
    return new StreamableFile(contents, { type: 'text/plain' });
  }
}
