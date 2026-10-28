import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

declare const dynamicTopic: string;

const buildPattern = () => ({ cmd: 'built' });

@Controller()
export class UnsupportedMessagePatternController {
  @EventPattern(dynamicTopic)
  dynamic() {
    return undefined;
  }

  @MessagePattern(buildPattern())
  computed() {
    return undefined;
  }

  @MessagePattern({ ...{ cmd: 'spread' } })
  spread() {
    return undefined;
  }

  @EventPattern()
  missing() {
    return undefined;
  }

  @EventPattern('audit.recorded')
  supported(entry: string) {
    return entry;
  }
}
