import type { Observable } from 'rxjs';

export type RemoteResult<T> = T extends (...args: never[]) => infer Result
  ? Promise<Awaited<Result>>
  : never;

type UnwrapObservableResult<Result> =
  Result extends Observable<infer Value>
    ? Value
    : Result extends Promise<Observable<infer Value>>
      ? Value
      : never;

export type RemoteObservableResult<T> = T extends (...args: never[]) => infer Result
  ? Promise<UnwrapObservableResult<Result>>
  : never;

export type RemoteStreamResult<T> = T extends (...args: never[]) => unknown ? Promise<Blob> : never;

export type RemoteMethod<T> = T extends (...args: infer Args) => unknown
  ? (...args: Args) => RemoteResult<T>
  : never;
