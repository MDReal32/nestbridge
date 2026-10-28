import { Controller, Get, Param } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { COUNT_COMMAND, EMAIL_EVENTS } from './email.events';

const LOCAL_TOPIC = 'email.local';

interface EmailRequest {
  recipient: string;
}

@Controller('emails')
export class EmailsController {
  @Get(':id')
  find(@Param('id') id: string) {
    return Promise.resolve({ id });
  }

  @EventPattern(EMAIL_EVENTS.requested)
  handleEmailRequested(@Payload() request: EmailRequest) {
    return request.recipient;
  }

  @EventPattern(LOCAL_TOPIC)
  handleLocal(recipient: string) {
    return recipient;
  }

  @MessagePattern(COUNT_COMMAND)
  count(@Ctx() context: unknown) {
    return Promise.resolve(context === undefined ? 0 : 1);
  }

  @MessagePattern({ cmd: 'email.sum', exact: false })
  sum(@Ctx() context: unknown, @Payload() values: number[]) {
    return values.reduce((total, value) => total + value, 0) + (context === undefined ? 0 : 0);
  }

  @MessagePattern(7)
  numeric() {
    return 7;
  }

  helper() {
    return 'not a handler';
  }
}
