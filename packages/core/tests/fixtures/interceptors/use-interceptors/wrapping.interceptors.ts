import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class GlobalInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ global: value })));
  }
}

@Injectable()
export class ClassOneInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ classOne: value })));
  }
}

@Injectable()
export class ClassTwoInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ classTwo: value })));
  }
}

@Injectable()
export class MethodInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ method: value })));
  }
}

@Injectable()
export class TopInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ top: value })));
  }
}

@Injectable()
export class BottomInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ bottom: value })));
  }
}
