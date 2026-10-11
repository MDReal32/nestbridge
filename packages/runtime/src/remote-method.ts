import type { Observable } from 'rxjs';
import type { AbortablePromise } from './abortable';

export type RemoteResult<T> = T extends (...args: never[]) => infer Result
  ? AbortablePromise<Awaited<Result>>
  : never;

type UnwrapObservableResult<Result> =
  Result extends Observable<infer Value>
    ? Value
    : Result extends Promise<Observable<infer Value>>
      ? Value
      : never;

export type RemoteObservableResult<T> = T extends (...args: never[]) => infer Result
  ? AbortablePromise<UnwrapObservableResult<Result>>
  : never;

export type RemoteStreamResult<T> = T extends (...args: never[]) => unknown
  ? AbortablePromise<Blob>
  : never;

export type RemoteMethod<T> = T extends (...args: infer Args) => unknown
  ? (...args: Args) => RemoteResult<T>
  : never;
