import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import type { CreateUserDto } from './user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @Query('details') details?: boolean) {
    return this.usersService.findOne(id, details);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }
}
