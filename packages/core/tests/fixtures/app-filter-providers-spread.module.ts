import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppProviderExceptionFilter } from './app-filter-provider-response.filter';
import { sharedProviders } from './shared-providers';

@Module({
  providers: [{ provide: APP_FILTER, useClass: AppProviderExceptionFilter }, ...sharedProviders],
})
export class AppModule {}
