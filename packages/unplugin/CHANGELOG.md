# @nestbridge/unplugin

## 2.6.1

### Patch Changes

- @nestbridge/core@2.6.1

## 2.6.0

### Minor Changes

- d6d1e38: Add microservice controllers. `@EventPattern()` and `@MessagePattern()` handlers on `@Controller()` classes become a third transport, next to HTTP routes and GraphQL resolvers, turned on per app with the new `messagePatterns: true` option (off by default; it needs the app's `name`, which addresses the service). The generated class keeps its HTTP methods and gains one method per handler: an event method emits and resolves with `void`, a message method sends and resolves with the handler's result, unwrapping a `Promise` and taking the last value of an `Observable`. The payload is the `@Payload()` parameter, or the first parameter when none is decorated.
  
  Patterns must be statically known: a string or number literal, an object literal of those, or a constant whose type is a literal or an `as const` object. Anything else gives an `unsupported-message-pattern` diagnostic and drops the method. `analyzeControllers()` takes a `{ messagePatterns }` option, and `ControllerDefinition` gains `messageHandlers`.
  
  The runtime adds a `@nestbridge/runtime/microservices` subpath, re-exported as `nestbridge/microservices`, with `configureNestBridgeMicroservices({ clients, defaultClient })`, `closeNestBridgeMicroservices()`, `emitMessage()`, `sendMessage()`, `NestBridgeMicroserviceError` and the `NestBridgeMessageResult` type. `@nestjs/microservices` is an optional peer dependency, and the main entry does not import it. This replaces nestrelay; see MIGRATION.md.
  
  Builds that use the same app name for the same server now record which build generated its shared declarations in `.nestbridge/<name>/…/nestbridge-app.json`. A build that configures that app differently (`messagePatterns` or the bootstrap file) reports an error naming the other build and does not overwrite its declarations.

### Patch Changes

- 6552c01: Fail one-shot builds on NestBridge problems and diagnostics, as documented. unplugin never told the plugin whether the bundler was watching, so `vite build` and webpack builds without `--watch` only logged them as warnings and exited successfully. The plugin now reads it from Vite's resolved config (`command` and `build.watch`) and from webpack's `compiler.watchMode`. The Vite dev server, Vitest, `vite build --watch`, webpack `--watch` and webpack-dev-server still only warn.
  
  Upgrading: a one-shot build that printed `[nestbridge]` warnings now fails on them. Fix the reported source, or state the value in the options.
- Updated dependencies [d6d1e38]
  - @nestbridge/core@2.6.0

## 2.5.1

### Patch Changes

- Updated dependencies
  - @nestbridge/core@2.5.1

## 2.5.0

### Minor Changes

- c2eb7ba: Generate `.nestbridge/` at the workspace root by default (the nearest ancestor with `nx.json`, `pnpm-workspace.yaml`, `turbo.json`, `lerna.json` or a `package.json` with `workspaces`), shared by every app, and fall back to the project root when there is no workspace. Declarations are mirrored relative to the workspace root so servers in different folders never collide, and each client's `nestbridge-error-body.d.ts` lives under its own folder.
  
  Upgrading: update your `tsconfig` `paths` (and any `nestbridge-error-body` import) to the new location, or set `outputDir` explicitly to keep the previous per-project layout.

### Patch Changes

- @nestbridge/core@2.5.0

## 2.4.2

### Patch Changes

- 1a60620: Write generated declarations under a `<file>.lock` lock, skip unchanged files and replace changed ones atomically, so several apps can safely share one `outputDir`.
- @nestbridge/core@2.4.2

## 2.4.1

### Patch Changes

- Updated dependencies [33aa8d7]
  - @nestbridge/core@2.4.1

## 2.4.0

### Minor Changes

- 2f13b42: Add per-call cancellation. Every generated controller and resolver method now returns an `AbortablePromise` — a regular `Promise` with an `abort(reason?)` method — so `new UsersController().findOne(id).abort()` cancels that call. Aborting aborts the underlying `fetch` and rejects the call with an `AbortError` (or the reason you pass); it is per call, does nothing once the call has settled, and rejects even when a custom `fetch` ignores the signal. An aborted call that nobody awaits raises no unhandled rejection. Aborts are not `NestBridgeError`s.
  
  `request()` and `graphqlRequest()` return the `AbortablePromise` and pass their `signal` to `fetch`. `graphqlRequest()` gains a `field` option that resolves with one root field of the response `data`; generated resolver methods use it instead of an `async` wrapper, which would have dropped `abort()`. `RemoteResult`, `RemoteObservableResult`, `RemoteStreamResult` and the generated wrapped-result alias resolve through `AbortablePromise`, which is exported as a type. It is a `Promise` subtype, so existing code that awaits calls keeps working.
- bb0f3a9: Add a `logLevel` plugin option (`'info' | 'warn' | 'error' | 'silent'`, the same values as Vite's) to quiet NestBridge's output, for example the watch-mode diagnostics that are logged as warnings so the dev server keeps running. `'error'` and `'silent'` hide those warnings, and `'warn'` and below hide `debug` messages. The level is set per app, and an unknown value fails with an explicit error. The `NestBridgeLogLevel` type is exported.
  
  The plugin now reports through the bundler's own logger instead of the console — Vite's `config.logger` and webpack's infrastructure logger — so Vite's `logLevel` and `customLogger`, and webpack's `infrastructureLogging.level`, apply to NestBridge without any option. Other bundlers still use the console. Diagnostics that fail a one-shot build are thrown and are not affected by the level.

### Patch Changes

- Updated dependencies [2f13b42]
  - @nestbridge/core@2.4.0

## 2.3.0

### Minor Changes

- 1ca473c: Support a bare `@Param()` that receives the whole route-parameter object, such as `findPost(@Param() params: PostParams)` for `@Get('posts/:slug')`. It used to be reported as an `unsupported-parameter` diagnostic. The generated client reads each `:token` of the path from the matching property of that object, `encodeURIComponent`-escaped, and a `@Param('name')` on the same method still wins for its own token. `ControllerParameterDefinition` allows an optional `name` for `kind: 'param'`, like `query` and `body`.
  
  A `@Param`, `@Query`, `@Body` or `@Headers` argument that is not a string literal, such as `@Param(ParseIntPipe)`, is still an `unsupported-parameter` diagnostic; a pipe as the second argument is fine.

### Patch Changes

- Updated dependencies [1ca473c]
  - @nestbridge/core@2.3.0

## 2.2.0

### Minor Changes

- 98349c7: One client can now use controllers from several NestJS apps. `nestBridge()` accepts an array of options, one entry per app, and each entry takes its own `name`, `root`, `controllers`, `resolvers`, `baseURL`, `bootstrap`, `globalPrefix` and `versioning`. A named app writes its declarations to `<outputDir>/<name>/`, detects its own response wrapper and error body from its own bootstrap file, and tags every generated request with its `name` as the `service`. A single object still works as before.
  
  The runtime picks each request's origin from `configureNestBridge({ services })`, then the origin the plugin registered for that app with the new `setNestBridgeServiceBaseURL(name, baseURL)`, then the global `setNestBridgeBaseURL()` value. `graphqlEndpoint` also accepts a record with one endpoint per app.
  
  `@Controller({ path, version })` and `@Version(...)` are now read, and the global prefix (`setGlobalPrefix`, including `exclude`) and URI versioning (`enableVersioning`) are detected from the bootstrap file and composed into every request path with the new `detectGlobalPrefix`, `detectVersioning` and `applyApplicationRouting` from `@nestbridge/core`. A prefix or versioning setup that cannot be read statically is reported as an `unsupported-global-prefix` or `unsupported-versioning` diagnostic; the `globalPrefix` and `versioning` plugin options state the value explicitly, and `false` ignores it.
  
  Upgrading: the global prefix and URI versioning are now part of every URL, so a prefix that was written into `baseURL` as a workaround would now be repeated. Keep `baseURL` to the origin, or set `globalPrefix: false` / `versioning: false`. A relative `root` now resolves against the bundler's root instead of `process.cwd()`. See `MIGRATION.md`.

### Patch Changes

- Updated dependencies [98349c7]
  - @nestbridge/core@2.2.0

## 2.1.4

### Patch Changes

- @nestbridge/core@2.1.4

## 2.1.3

### Patch Changes

- cec7886: Fix `Cannot find module '.../typescript/unstable/ast'` when loading `@nestbridge/vite` or `@nestbridge/webpack` in a project that has its own `typescript` (for example 6.x) installed. Each package previously bundled a private copy of its internal `@nestbridge/*` dependencies, so core's `typescript@7` import was resolved against the host project's `typescript` instead of the one core declares. Internal packages are now external, so imports resolve through the declared dependency chain and the bundles shrink accordingly.
- @nestbridge/core@2.1.3

## 2.1.2

### Patch Changes

- e391e8f: Fix `yarn add nestbridge` (and `npm install nestbridge`) failing with `Workspace not found (@nestbridge/runtime@workspace:*)`. Previously published manifests shipped Yarn's `workspace:*` dependency specifiers verbatim because the release pipeline packed with plain `npm publish`. Packages are now packed with `yarn pack`, which rewrites them to the real version, and the release aborts if any `workspace:` specifier survives in the tarball.
- @nestbridge/core@2.1.2

## 2.1.1

### Patch Changes

- c7fe551: Fix `outputDir` resolving relative to `root` instead of the bundler's own project root. `root` now controls only where controllers, resolvers, and the bootstrap `main.ts` are discovered, while `outputDir` always resolves relative to Vite's `config.root` or webpack's `compiler.options.context`. This removes the need to widen `root` to a parent directory just to reach a bootstrap file that lives outside the client project, and fixes webpack builds that previously had no way to resolve their own project root at all.
- @nestbridge/core@2.1.1

## 2.1.0

### Minor Changes

- a21adfa: Add static detection of a global response-wrapper interceptor (`app.useGlobalInterceptors(...)`, composing multiple chained interceptors in registration order) and a global `@Catch` exception filter's error response body shape (registered via `app.useGlobalFilters(...)` or an `APP_FILTER` provider). Both are reflected automatically in generated client types with no configuration: a detected response wrapper reshapes the generated controller/resolver return types, and a detected error body is written to `nestbridge-error-body.d.ts` for use with the new `isNestBridgeError()` type guard exported from `@nestbridge/runtime`. Neither writes anything when nothing is registered, or the shape isn't exactly recognized.

### Patch Changes

- Updated dependencies [a21adfa]
  - @nestbridge/core@2.1.0

## 2.0.4

### Patch Changes

- @nestbridge/core@2.0.4
