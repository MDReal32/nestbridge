import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RootInterceptor } from '../app-interceptor/wrapping.interceptors';
import { interceptorProviders } from './providers';

@Module({
  providers: [{ provide: APP_INTERCEPTOR, useClass: RootInterceptor }, ...interceptorProviders],
})
export class AppModule {}
