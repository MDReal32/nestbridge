export interface AbortablePromise<T> extends Promise<T> {
  /**
   * Cancels the call. The promise rejects with the abort reason (an
   * `AbortError` by default) and the underlying `fetch` is aborted; calling it
   * once the call has settled does nothing. Promises derived with `then`,
   * `catch` or `finally` are plain promises and do not carry `abort`.
   */
  abort(reason?: unknown): void;
}
