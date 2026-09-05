import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { UsersService } from 'basic-server/src/users/users.service';
import type { CreateUserDto, SearchUsersQuery, UserDto } from './user.dto';

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

  @Get('filter')
  filter(@Query() query: SearchUsersQuery): Promise<UserDto[]> {
    return this.usersService.filter(query);
  }

  @Post()
  create(@Body() body: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(body);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() body: CreateUserDto): Promise<UserDto> {
    return this.usersService.replace(id, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<CreateUserDto>): Promise<UserDto> {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  @Get('by-header')
  byHeader(@Headers('x-example') value: string): Promise<UserDto> {
    return this.usersService.byHeader(value);
  }

  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: exists to verify non-endpoint members are excluded
  private helperNotAnEndpoint() {
    return 'not exposed';
  }
}
