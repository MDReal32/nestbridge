import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SecondExceptionFilter } from './conflicting-filter-registrations.second.filter';

@Module({
  providers: [{ provide: APP_FILTER, useClass: SecondExceptionFilter }],
})
export class AppModule {}
