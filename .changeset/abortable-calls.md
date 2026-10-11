---
"@nestbridge/core": minor
"@nestbridge/runtime": minor
"@nestbridge/unplugin": minor
"nestbridge": minor
---

Add per-call cancellation. Every generated controller and resolver method now returns an `AbortablePromise` — a regular `Promise` with an `abort(reason?)` method — so `new UsersController().findOne(id).abort()` cancels that call. Aborting aborts the underlying `fetch` and rejects the call with an `AbortError` (or the reason you pass); it is per call, does nothing once the call has settled, and rejects even when a custom `fetch` ignores the signal. An aborted call that nobody awaits raises no unhandled rejection. Aborts are not `NestBridgeError`s.

`request()` and `graphqlRequest()` return the `AbortablePromise` and pass their `signal` to `fetch`. `graphqlRequest()` gains a `field` option that resolves with one root field of the response `data`; generated resolver methods use it instead of an `async` wrapper, which would have dropped `abort()`. `RemoteResult`, `RemoteObservableResult`, `RemoteStreamResult` and the generated wrapped-result alias resolve through `AbortablePromise`, which is exported as a type. It is a `Promise` subtype, so existing code that awaits calls keeps working.
