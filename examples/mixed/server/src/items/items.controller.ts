import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import type { CreateItemDto } from './item.dto';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(@Inject(ItemsService) private readonly itemsService: ItemsService) {}

  @Get('mine')
  findMine(@CurrentUser() userId: string) {
    return this.itemsService.findOne(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateItemDto) {
    return this.itemsService.create(body);
  }
}
