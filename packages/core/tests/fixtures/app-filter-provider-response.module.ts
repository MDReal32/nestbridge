import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppProviderExceptionFilter } from './app-filter-provider-response.filter';

@Module({
  providers: [{ provide: APP_FILTER, useClass: AppProviderExceptionFilter }],
})
export class AppModule {}
