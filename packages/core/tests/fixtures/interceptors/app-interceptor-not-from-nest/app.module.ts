import { Module } from '@nestjs/common';
import { RootInterceptor } from '../app-interceptor/wrapping.interceptors';
import { APP_INTERCEPTOR } from './tokens';

@Module({
  providers: [{ provide: APP_INTERCEPTOR, useClass: RootInterceptor }],
})
export class AppModule {}
