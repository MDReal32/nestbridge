import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AlphaModule } from './alpha.module';
import { BetaInterceptor } from './wrapping.interceptors';

@Module({
  imports: [AlphaModule],
  providers: [{ provide: APP_INTERCEPTOR, useClass: BetaInterceptor }],
})
export class BetaModule {}
