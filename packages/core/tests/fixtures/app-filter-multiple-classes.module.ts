import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { FirstExceptionFilter } from './conflicting-filter-registrations.first.filter';
import { SecondExceptionFilter } from './conflicting-filter-registrations.second.filter';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: FirstExceptionFilter },
    { provide: APP_FILTER, useClass: SecondExceptionFilter },
  ],
})
export class AppModule {}
