import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

declare const dynamicTopic: string;

@Controller('audit')
export class AuditController {
  @EventPattern(dynamicTopic)
  dynamic() {
    return undefined;
  }

  @EventPattern('audit.recorded')
  supported(entry: string) {
    return entry;
  }
}
