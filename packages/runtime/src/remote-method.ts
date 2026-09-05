export type RemoteResult<T> = T extends (...args: never[]) => infer Result
  ? Promise<Awaited<Result>>
  : never;

export type RemoteMethod<T> = T extends (...args: infer Args) => unknown
  ? (...args: Args) => RemoteResult<T>
  : never;
