import type { AbortablePromise } from './abortable-promise';

/**
 * Aborting is deliberate, so `abort()` marks the promise as handled: a call
 * cancelled without being awaited, such as `controller.method().abort()`, does
 * not raise an unhandled rejection. Anyone awaiting or chaining the promise
 * still receives the rejection, and failures that are not aborts stay
 * unhandled as usual.
 */
export const createAbortablePromise = <T>(
  start: (signal: AbortSignal) => Promise<T>,
): AbortablePromise<T> => {
  const controller = new AbortController();

  const promise = new Promise<T>((resolve, reject) => {
    controller.signal.addEventListener('abort', () => reject(controller.signal.reason), {
      once: true,
    });

    start(controller.signal).then(resolve, reject);
  });

  return Object.assign(promise, {
    abort: (reason?: unknown) => {
      promise.catch(() => undefined);
      controller.abort(reason);
    },
  });
};
