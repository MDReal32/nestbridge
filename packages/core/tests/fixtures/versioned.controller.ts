import { Controller, Get, Post, VERSION_NEUTRAL, Version } from '@nestjs/common';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  @Get()
  list() {
    return [];
  }

  @Version('2')
  @Get(':id')
  findOne() {
    return {};
  }

  @Version(VERSION_NEUTRAL)
  @Get('health')
  health() {
    return 'ok';
  }

  @Version(['3', '4'])
  @Post()
  create() {
    return {};
  }
}

@Controller({ version: VERSION_NEUTRAL })
export class NeutralController {
  @Get('neutral')
  show() {
    return {};
  }
}

@Controller({ path: 'plain' })
export class UnversionedController {
  @Get()
  list() {
    return [];
  }
}

@Controller({ path: 'multi', version: ['5', '6'] })
export class MultiVersionController {
  @Get()
  list() {
    return [];
  }
}
