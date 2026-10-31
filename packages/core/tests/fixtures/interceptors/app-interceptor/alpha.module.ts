import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GammaModule } from './gamma.module';
import { AlphaInterceptor } from './wrapping.interceptors';

@Module({
  imports: [GammaModule],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AlphaInterceptor }],
})
export class AlphaModule {}
