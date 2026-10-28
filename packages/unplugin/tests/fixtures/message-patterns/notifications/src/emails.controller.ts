import { Controller, Get, Param } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

const EMAIL_EVENTS = { requested: 'email.requested' } as const;

@Controller('emails')
export class EmailsController {
  @Get(':id')
  find(@Param('id') id: string) {
    return Promise.resolve({ id });
  }

  @EventPattern(EMAIL_EVENTS.requested)
  handleEmailRequested(@Payload() recipient: string) {
    return recipient;
  }

  @MessagePattern({ cmd: 'count' })
  count() {
    return 3;
  }
}
