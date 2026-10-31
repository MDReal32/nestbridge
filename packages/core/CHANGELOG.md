# @nestbridge/core

## 3.0.0

### Minor Changes

- b5009b4: Response-shaping interceptors are now detected per route instead of as one app-wide wrapper, and anything that cannot be read is reported instead of silently ignored.
  
  Each JSON route gets its own interceptor chain, outermost first: `APP_INTERCEPTOR` providers (`useClass` only, read from the root module and the modules it imports), then `app.useGlobalInterceptors(new X())`, then the controller's `@UseInterceptors`, then the method's `@UseInterceptors`. `intercept()` may hold any statements before its final `return`; the returned `next.handle()` may be piped through any number of operators. `map` operators compose in order, `tap`, `timeout` and `finalize` are shape-neutral, and a bare `return next.handle()` changes nothing. Shorthand properties (`{ data }`) and `-`, `*`, `/`, `%` arithmetic (typed `number`) are understood in `map` bodies. Message handlers and GraphQL resolvers are not wrapped yet.
  
  An interceptor that cannot be analyzed (another operator, a `useFactory` / `useValue` / `useExisting` / spread provider, a class from a package, an unreadable `map` body, a `@UseInterceptors` argument that is not a class or `new X()`) is a new `unsupported-interceptor` diagnostic, reported once per interceptor at its source location. The JSON routes under it are declared as `AbortablePromise<unknown>`. A one-shot build fails on the diagnostic; watch mode warns.
  
  Breaking changes to `@nestbridge/core`:
  
  - `detectResponseWrapper` is removed. `analyzeControllers(files, { bootstrapFilePath })` now attaches an optional `responseWrapper` to each JSON method of the result and returns `interceptorFiles`, the files that took part in the detection.
  - `generateControllerDeclaration(definition, outputFilePath)` no longer takes a response wrapper argument; it reads each method's own `responseWrapper`. A declaration can now hold several `__NestBridgeWrapped` helper aliases (`__NestBridgeWrapped`, `__NestBridgeWrapped2`, ...), one per distinct shape. Controllers without a response-shaping interceptor produce the same output as before.
  
  `@nestbridge/unplugin` passes the bootstrap file to the controller analysis, re-analyzes when a file that contributed to interceptor detection changes, and registers those files and the bootstrap file with the bundler's watcher.

## 2.6.1

No changes in this release.

## 2.6.0

### Minor Changes

- d6d1e38: Add microservice controllers. `@EventPattern()` and `@MessagePattern()` handlers on `@Controller()` classes become a third transport, next to HTTP routes and GraphQL resolvers, turned on per app with the new `messagePatterns: true` option (off by default; it needs the app's `name`, which addresses the service). The generated class keeps its HTTP methods and gains one method per handler: an event method emits and resolves with `void`, a message method sends and resolves with the handler's result, unwrapping a `Promise` and taking the last value of an `Observable`. The payload is the `@Payload()` parameter, or the first parameter when none is decorated.
  
  Patterns must be statically known: a string or number literal, an object literal of those, or a constant whose type is a literal or an `as const` object. Anything else gives an `unsupported-message-pattern` diagnostic and drops the method. `analyzeControllers()` takes a `{ messagePatterns }` option, and `ControllerDefinition` gains `messageHandlers`.
  
  The runtime adds a `@nestbridge/runtime/microservices` subpath, re-exported as `nestbridge/microservices`, with `configureNestBridgeMicroservices({ clients, defaultClient })`, `closeNestBridgeMicroservices()`, `emitMessage()`, `sendMessage()`, `NestBridgeMicroserviceError` and the `NestBridgeMessageResult` type. `@nestjs/microservices` is an optional peer dependency, and the main entry does not import it. This replaces nestrelay; see MIGRATION.md.
  
  Builds that use the same app name for the same server now record which build generated its shared declarations in `.nestbridge/<name>/…/nestbridge-app.json`. A build that configures that app differently (`messagePatterns` or the bootstrap file) reports an error naming the other build and does not overwrite its declarations.

## 2.5.1

### Patch Changes

- Fix `T | null` unions being rejected as unsupported in resolver arguments and model fields, and honour `@Args(..., { nullable: true })` when deriving an argument's GraphQL type.

## 2.5.0

No changes in this release.

## 2.4.2

No changes in this release.

## 2.4.1

### Patch Changes

- 33aa8d7: Treat parameters carrying a custom decorator (for example `@CurrentUser()`) as server-resolved: they no longer drop the method from the generated client, and are left out of the generated method signature.

## 2.4.0

### Minor Changes

- 2f13b42: Add per-call cancellation. Every generated controller and resolver method now returns an `AbortablePromise` — a regular `Promise` with an `abort(reason?)` method — so `new UsersController().findOne(id).abort()` cancels that call. Aborting aborts the underlying `fetch` and rejects the call with an `AbortError` (or the reason you pass); it is per call, does nothing once the call has settled, and rejects even when a custom `fetch` ignores the signal. An aborted call that nobody awaits raises no unhandled rejection. Aborts are not `NestBridgeError`s.
  
  `request()` and `graphqlRequest()` return the `AbortablePromise` and pass their `signal` to `fetch`. `graphqlRequest()` gains a `field` option that resolves with one root field of the response `data`; generated resolver methods use it instead of an `async` wrapper, which would have dropped `abort()`. `RemoteResult`, `RemoteObservableResult`, `RemoteStreamResult` and the generated wrapped-result alias resolve through `AbortablePromise`, which is exported as a type. It is a `Promise` subtype, so existing code that awaits calls keeps working.

## 2.3.0

### Minor Changes

- 1ca473c: Support a bare `@Param()` that receives the whole route-parameter object, such as `findPost(@Param() params: PostParams)` for `@Get('posts/:slug')`. It used to be reported as an `unsupported-parameter` diagnostic. The generated client reads each `:token` of the path from the matching property of that object, `encodeURIComponent`-escaped, and a `@Param('name')` on the same method still wins for its own token. `ControllerParameterDefinition` allows an optional `name` for `kind: 'param'`, like `query` and `body`.
  
  A `@Param`, `@Query`, `@Body` or `@Headers` argument that is not a string literal, such as `@Param(ParseIntPipe)`, is still an `unsupported-parameter` diagnostic; a pipe as the second argument is fine.

## 2.2.0

### Minor Changes

- 98349c7: One client can now use controllers from several NestJS apps. `nestBridge()` accepts an array of options, one entry per app, and each entry takes its own `name`, `root`, `controllers`, `resolvers`, `baseURL`, `bootstrap`, `globalPrefix` and `versioning`. A named app writes its declarations to `<outputDir>/<name>/`, detects its own response wrapper and error body from its own bootstrap file, and tags every generated request with its `name` as the `service`. A single object still works as before.
  
  The runtime picks each request's origin from `configureNestBridge({ services })`, then the origin the plugin registered for that app with the new `setNestBridgeServiceBaseURL(name, baseURL)`, then the global `setNestBridgeBaseURL()` value. `graphqlEndpoint` also accepts a record with one endpoint per app.
  
  `@Controller({ path, version })` and `@Version(...)` are now read, and the global prefix (`setGlobalPrefix`, including `exclude`) and URI versioning (`enableVersioning`) are detected from the bootstrap file and composed into every request path with the new `detectGlobalPrefix`, `detectVersioning` and `applyApplicationRouting` from `@nestbridge/core`. A prefix or versioning setup that cannot be read statically is reported as an `unsupported-global-prefix` or `unsupported-versioning` diagnostic; the `globalPrefix` and `versioning` plugin options state the value explicitly, and `false` ignores it.
  
  Upgrading: the global prefix and URI versioning are now part of every URL, so a prefix that was written into `baseURL` as a workaround would now be repeated. Keep `baseURL` to the origin, or set `globalPrefix: false` / `versioning: false`. A relative `root` now resolves against the bundler's root instead of `process.cwd()`. See `MIGRATION.md`.

## 2.1.4

No changes in this release.

## 2.1.3

No changes in this release.

## 2.1.2

No changes in this release.

## 2.1.1

No changes in this release.

## 2.1.0

### Minor Changes

- a21adfa: Add static detection of a global response-wrapper interceptor (`app.useGlobalInterceptors(...)`, composing multiple chained interceptors in registration order) and a global `@Catch` exception filter's error response body shape (registered via `app.useGlobalFilters(...)` or an `APP_FILTER` provider). Both are reflected automatically in generated client types with no configuration: a detected response wrapper reshapes the generated controller/resolver return types, and a detected error body is written to `nestbridge-error-body.d.ts` for use with the new `isNestBridgeError()` type guard exported from `@nestbridge/runtime`. Neither writes anything when nothing is registered, or the shape isn't exactly recognized.

## 2.0.4

No changes in this release.

## 2.0.0

No changes in this release.

## 1.1.1

No changes in this release.

## 1.1.0

### Minor Changes

- 7336719: Add support for controller methods that return `Observable<T>` or `StreamableFile`. The analyzer now detects these return types (`ResponseKind`), the generated client requests a blob for streamed responses, and `@nestbridge/runtime` exposes `RemoteObservableResult`/`RemoteStreamResult` helper types alongside the existing `RemoteResult`.

## 1.0.1

### Patch Changes

- Refresh package READMEs to document GraphQL resolver support.

## 1.0.0

### Major Changes

- Release 1.0.0.

### Minor Changes

- 4dea4e9: Add GraphQL resolver support. `@nestbridge/core` statically analyzes `@Resolver()`/`@Query()`/`@Mutation()` classes and `@ObjectType()`/`@Field()` types to build selection sets and diagnostics; `@nestbridge/runtime` adds a `graphqlRequest` client; `@nestbridge/vite` gains a `resolvers` option that generates client-facing resolver stubs backed by it; `nestbridge` re-exports the new GraphQL API.
