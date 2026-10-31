import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { GammaInterceptor } from './wrapping.interceptors';

@Module({
  imports: [],
  providers: [{ provide: APP_INTERCEPTOR, useClass: GammaInterceptor }],
})
export class GammaModule {}
