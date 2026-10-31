import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class RootInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ root: value })));
  }
}

@Injectable()
export class AlphaInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ alpha: value })));
  }
}

@Injectable()
export class GammaInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ gamma: value })));
  }
}

@Injectable()
export class BetaInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ beta: value })));
  }
}

@Injectable()
export class BootstrapInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ bootstrap: value })));
  }
}
