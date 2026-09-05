export interface UserDto {
  id: string;
  name: string;
}

export interface CreateUserDto {
  name: string;
}

export interface SearchUsersQuery {
  name?: string;
}
