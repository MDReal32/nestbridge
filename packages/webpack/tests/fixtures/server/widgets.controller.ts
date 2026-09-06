import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import type { CreateUserDto, UserDto } from './user.dto';
import type { UsersService } from './users.service';

@Controller('widgets')
export class WidgetsController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @Query('details') details?: boolean): Promise<UserDto> {
    return this.usersService.findOne(id, details);
  }

  @Get()
  search(@Query('name') name: string): Promise<UserDto[]> {
    return this.usersService.search(name);
  }

  @Post()
  create(@Body() body: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(body);
  }

  @Get('by-header')
  byHeader(@Headers('x-example') value: string): Promise<UserDto> {
    return this.usersService.byHeader(value);
  }
}
