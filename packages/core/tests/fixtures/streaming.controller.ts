import { Controller, Get, Param, type StreamableFile } from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { UserDto } from './user.dto';

@Controller('streaming')
export class StreamingController {
  @Get(':id')
  watch(@Param('id') id: string): Observable<UserDto> {
    return this.watchSource(id);
  }

  @Get(':id/download')
  download(@Param('id') id: string): StreamableFile {
    return this.downloadSource(id);
  }

  @Get(':id/download-async')
  downloadAsync(@Param('id') id: string): Promise<StreamableFile> {
    return this.downloadSourceAsync(id);
  }

  @Get(':id/plain')
  plain(@Param('id') id: string): Promise<UserDto> {
    return this.plainSource(id);
  }

  private watchSource(_id: string): Observable<UserDto> {
    throw new Error('not implemented');
  }

  private downloadSource(_id: string): StreamableFile {
    throw new Error('not implemented');
  }

  private downloadSourceAsync(_id: string): Promise<StreamableFile> {
    throw new Error('not implemented');
  }

  private plainSource(_id: string): Promise<UserDto> {
    throw new Error('not implemented');
  }
}
