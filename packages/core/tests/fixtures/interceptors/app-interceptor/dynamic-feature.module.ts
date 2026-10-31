import type { DynamicModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RootInterceptor } from './wrapping.interceptors';

@Module({})
export class DynamicFeatureModule {
  readonly isDynamic = true;

  static forRoot(): DynamicModule {
    return {
      module: DynamicFeatureModule,
      providers: [{ provide: APP_INTERCEPTOR, useClass: RootInterceptor }],
    };
  }
}
