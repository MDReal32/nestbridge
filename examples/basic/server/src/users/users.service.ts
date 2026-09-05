import { Injectable } from '@nestjs/common';
import type { CreateUserDto, UserDto } from './user.dto';

@Injectable()
export class UsersService {
  private readonly users: UserDto[] = [{ id: '123', name: 'MDReal' }];

  findOne(id: string, details?: boolean) {
    const user = this.users.find((candidate) => candidate.id === id) ?? { id, name: 'Unknown' };
    return Promise.resolve(details ? user : { id: user.id, name: user.name });
  }

  create(body: CreateUserDto) {
    const user: UserDto = { id: String(this.users.length + 1), name: body.name };
    this.users.push(user);
    return Promise.resolve(user);
  }
}
