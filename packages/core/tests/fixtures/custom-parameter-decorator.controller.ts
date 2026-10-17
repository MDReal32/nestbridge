import { Controller, createParamDecorator, Get, Param } from '@nestjs/common';

const CurrentUser = createParamDecorator(() => 'admin-id');

@Controller('auth')
export class CustomParameterDecoratorController {
  @Get('me')
  me(@CurrentUser() adminId: string) {
    return Promise.resolve({ adminId });
  }

  @Get('audit/:id')
  audit(@CurrentUser() adminId: string, @Param('id') id: string) {
    return Promise.resolve({ adminId, id });
  }
}
