import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

const CurrentTenant = () => () => undefined;

@Controller()
export class NotificationsController {
  @EventPattern('notification.sent')
  handleSent(@Payload() id: string) {
    return id;
  }

  @MessagePattern('notification.pending')
  pending(@CurrentTenant() tenant: string, unused: string) {
    return [tenant, unused];
  }
}
