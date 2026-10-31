import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SomeExternalModule } from 'some-external-package';
import { AlphaModule } from './alpha.module';
import { BetaModule } from './beta.module';
import { DynamicFeatureModule } from './dynamic-feature.module';
import { RootInterceptor } from './wrapping.interceptors';

@Module({
  imports: [AlphaModule, DynamicFeatureModule.forRoot(), SomeExternalModule, BetaModule],
  providers: [{ provide: APP_INTERCEPTOR, useClass: RootInterceptor }],
})
export class AppModule {}
