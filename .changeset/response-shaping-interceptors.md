---
"@nestbridge/core": minor
"@nestbridge/unplugin": minor
---

Response-shaping interceptors are now detected per route instead of as one app-wide wrapper, and anything that cannot be read is reported instead of silently ignored.

Each JSON route gets its own interceptor chain, outermost first: `APP_INTERCEPTOR` providers (`useClass` only, read from the root module and the modules it imports), then `app.useGlobalInterceptors(new X())`, then the controller's `@UseInterceptors`, then the method's `@UseInterceptors`. `intercept()` may hold any statements before its final `return`; the returned `next.handle()` may be piped through any number of operators. `map` operators compose in order, `tap`, `timeout` and `finalize` are shape-neutral, and a bare `return next.handle()` changes nothing. Shorthand properties (`{ data }`) and `-`, `*`, `/`, `%` arithmetic (typed `number`) are understood in `map` bodies. Message handlers and GraphQL resolvers are not wrapped yet.

An interceptor that cannot be analyzed (another operator, a `useFactory` / `useValue` / `useExisting` / spread provider, a class from a package, an unreadable `map` body, a `@UseInterceptors` argument that is not a class or `new X()`) is a new `unsupported-interceptor` diagnostic, reported once per interceptor at its source location. The JSON routes under it are declared as `AbortablePromise<unknown>`. A one-shot build fails on the diagnostic; watch mode warns.

Breaking changes to `@nestbridge/core`:

- `detectResponseWrapper` is removed. `analyzeControllers(files, { bootstrapFilePath })` now attaches an optional `responseWrapper` to each JSON method of the result and returns `interceptorFiles`, the files that took part in the detection.
- `generateControllerDeclaration(definition, outputFilePath)` no longer takes a response wrapper argument; it reads each method's own `responseWrapper`. A declaration can now hold several `__NestBridgeWrapped` helper aliases (`__NestBridgeWrapped`, `__NestBridgeWrapped2`, ...), one per distinct shape. Controllers without a response-shaping interceptor produce the same output as before.

`@nestbridge/unplugin` passes the bootstrap file to the controller analysis, re-analyzes when a file that contributed to interceptor detection changes, and registers those files and the bootstrap file with the bundler's watcher.
