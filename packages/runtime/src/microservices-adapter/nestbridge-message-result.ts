import type { Observable } from 'rxjs';

export type NestBridgeMessageResult<Result> =
  Result extends Observable<infer Value>
    ? Value
    : Result extends Promise<Observable<infer Value>>
      ? Value
      : Awaited<Result>;
