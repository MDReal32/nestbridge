import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RootInterceptor } from '../app-interceptor/wrapping.interceptors';

@Module({
  providers: [{ provide: APP_INTERCEPTOR, useExisting: RootInterceptor }],
})
export class AppModule {}
