import { Injectable } from '@nestjs/common';
import type { CreateItemDto, ItemDto } from './item.dto';

@Injectable()
export class ItemsService {
  private readonly items: ItemDto[] = [{ id: '1', label: 'First item' }];

  findOne(id: string) {
    const item = this.items.find((candidate) => candidate.id === id) ?? { id, label: 'Unknown' };
    return Promise.resolve(item);
  }

  create(body: CreateItemDto) {
    const item: ItemDto = { id: String(this.items.length + 1), label: body.label };
    this.items.push(item);
    return Promise.resolve(item);
  }
}
