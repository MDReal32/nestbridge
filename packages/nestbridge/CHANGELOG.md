# nestbridge

## 2.3.0

### Minor Changes

- 1ca473c: Support a bare `@Param()` that receives the whole route-parameter object, such as `findPost(@Param() params: PostParams)` for `@Get('posts/:slug')`. It used to be reported as an `unsupported-parameter` diagnostic. The generated client reads each `:token` of the path from the matching property of that object, `encodeURIComponent`-escaped, and a `@Param('name')` on the same method still wins for its own token. `ControllerParameterDefinition` allows an optional `name` for `kind: 'param'`, like `query` and `body`.
  
  A `@Param`, `@Query`, `@Body` or `@Headers` argument that is not a string literal, such as `@Param(ParseIntPipe)`, is still an `unsupported-parameter` diagnostic; a pipe as the second argument is fine.

### Patch Changes

- @nestbridge/vite@2.3.0
  - @nestbridge/webpack@2.3.0
  - @nestbridge/runtime@2.3.0

## 2.2.0

### Minor Changes

- 98349c7: One client can now use controllers from several NestJS apps. `nestBridge()` accepts an array of options, one entry per app, and each entry takes its own `name`, `root`, `controllers`, `resolvers`, `baseURL`, `bootstrap`, `globalPrefix` and `versioning`. A named app writes its declarations to `<outputDir>/<name>/`, detects its own response wrapper and error body from its own bootstrap file, and tags every generated request with its `name` as the `service`. A single object still works as before.
  
  The runtime picks each request's origin from `configureNestBridge({ services })`, then the origin the plugin registered for that app with the new `setNestBridgeServiceBaseURL(name, baseURL)`, then the global `setNestBridgeBaseURL()` value. `graphqlEndpoint` also accepts a record with one endpoint per app.
  
  `@Controller({ path, version })` and `@Version(...)` are now read, and the global prefix (`setGlobalPrefix`, including `exclude`) and URI versioning (`enableVersioning`) are detected from the bootstrap file and composed into every request path with the new `detectGlobalPrefix`, `detectVersioning` and `applyApplicationRouting` from `@nestbridge/core`. A prefix or versioning setup that cannot be read statically is reported as an `unsupported-global-prefix` or `unsupported-versioning` diagnostic; the `globalPrefix` and `versioning` plugin options state the value explicitly, and `false` ignores it.
  
  Upgrading: the global prefix and URI versioning are now part of every URL, so a prefix that was written into `baseURL` as a workaround would now be repeated. Keep `baseURL` to the origin, or set `globalPrefix: false` / `versioning: false`. A relative `root` now resolves against the bundler's root instead of `process.cwd()`. See `MIGRATION.md`.

### Patch Changes

- Updated dependencies [98349c7]
  - @nestbridge/runtime@2.2.0
  - @nestbridge/vite@2.2.0
  - @nestbridge/webpack@2.2.0

## 2.1.4

### Patch Changes

- db8c54a: Make editors show the real kind (function, class, interface, type) for every `nestbridge` export instead of a generic icon in import autocomplete. The package entry now star re-exports `@nestbridge/runtime`, and the runtime declares its types inline instead of in a trailing `export type {}` block, so TypeScript no longer reports each symbol as an alias.
  
  `nestbridge` now also exports `RemoteObservableResult` and `RemoteStreamResult`, which generated declarations for `Observable<T>` and `StreamableFile` controller methods import from `nestbridge` but the package did not previously export.
  
  The README files are updated to match the current API: install `nestbridge`, `baseURL` is a plugin option applied to the runtime automatically, GraphQL uses plain `fetch`, and the Observable and `StreamableFile` support is documented.
- Updated dependencies [db8c54a]
  - @nestbridge/runtime@2.1.4
  - @nestbridge/vite@2.1.4
  - @nestbridge/webpack@2.1.4

## 2.1.3

### Patch Changes

- Updated dependencies [cec7886]
  - @nestbridge/vite@2.1.3
  - @nestbridge/webpack@2.1.3
  - @nestbridge/runtime@2.1.3

## 2.1.2

### Patch Changes

- e391e8f: Fix `yarn add nestbridge` (and `npm install nestbridge`) failing with `Workspace not found (@nestbridge/runtime@workspace:*)`. Previously published manifests shipped Yarn's `workspace:*` dependency specifiers verbatim because the release pipeline packed with plain `npm publish`. Packages are now packed with `yarn pack`, which rewrites them to the real version, and the release aborts if any `workspace:` specifier survives in the tarball.
- Updated dependencies [e391e8f]
  - @nestbridge/vite@2.1.2
  - @nestbridge/webpack@2.1.2
  - @nestbridge/runtime@2.1.2

## 2.1.1

### Patch Changes

- c7fe551: Fix `outputDir` resolving relative to `root` instead of the bundler's own project root. `root` now controls only where controllers, resolvers, and the bootstrap `main.ts` are discovered, while `outputDir` always resolves relative to Vite's `config.root` or webpack's `compiler.options.context`. This removes the need to widen `root` to a parent directory just to reach a bootstrap file that lives outside the client project, and fixes webpack builds that previously had no way to resolve their own project root at all.
- Updated dependencies [c7fe551]
  - @nestbridge/vite@2.1.1
  - @nestbridge/webpack@2.1.1
  - @nestbridge/runtime@2.1.1

## 2.1.0

### Minor Changes

- a21adfa: Add static detection of a global response-wrapper interceptor (`app.useGlobalInterceptors(...)`, composing multiple chained interceptors in registration order) and a global `@Catch` exception filter's error response body shape (registered via `app.useGlobalFilters(...)` or an `APP_FILTER` provider). Both are reflected automatically in generated client types with no configuration: a detected response wrapper reshapes the generated controller/resolver return types, and a detected error body is written to `nestbridge-error-body.d.ts` for use with the new `isNestBridgeError()` type guard exported from `@nestbridge/runtime`. Neither writes anything when nothing is registered, or the shape isn't exactly recognized.

### Patch Changes

- Updated dependencies [a21adfa]
  - @nestbridge/runtime@2.1.0
  - @nestbridge/vite@2.1.0
  - @nestbridge/webpack@2.1.0

## 2.0.4

### Patch Changes

- ae14e27: Fix the release workflow's build-artifact hand-off so published packages actually include their `build` directory. Previous releases (up to 2.0.3) were published with an empty `build` folder due to a path-stripping bug in the CI upload/download steps.
- @nestbridge/runtime@2.0.4
  - @nestbridge/vite@2.0.4
  - @nestbridge/webpack@2.0.4

## 2.0.0

### Major Changes

- f474d7f: Make the `@nestbridge/vite` plugin's `baseURL` option actually configure the generated client. Every generated controller/resolver module now statically imports a new `virtual:nestbridge/config` module that calls `setNestBridgeBaseURL(...)` before any user code runs, so requests are sent to the configured server without any manual setup.
  
  **Breaking:** `NestBridgeConfig.baseURL` has been removed from `configureNestBridge`. `configureNestBridge` fully replaces its config object rather than merging into it, so a `baseURL` living inside it could be silently wiped out by a later `configureNestBridge({...})` call made for an unrelated reason (e.g. to set `headers`). The base URL is now tracked independently via the new `setNestBridgeBaseURL`/`getNestBridgeBaseURL` functions, which `configureNestBridge` never touches. If you were calling `configureNestBridge({ baseURL: '...' })` directly, call `setNestBridgeBaseURL('...')` instead.

### Patch Changes

- Updated dependencies [f474d7f]
  - @nestbridge/runtime@2.0.0
  - @nestbridge/vite@2.0.0

## 1.1.1

### Patch Changes

- Updated dependencies [020df80]
  - @nestbridge/runtime@1.1.1
  - @nestbridge/vite@1.1.1

## 1.0.2

### Patch Changes

- Updated dependencies [7336719]
- Updated dependencies [7336719]
- Updated dependencies [7336719]
  - @nestbridge/runtime@1.1.0
  - @nestbridge/vite@1.1.0

## 1.0.1

### Patch Changes

- Refresh package READMEs to document GraphQL resolver support.
- Updated dependencies
  - @nestbridge/runtime@1.0.1
  - @nestbridge/vite@1.0.1

## 1.0.0

### Major Changes

- Release 1.0.0.

### Minor Changes

- 4dea4e9: Add GraphQL resolver support. `@nestbridge/core` statically analyzes `@Resolver()`/`@Query()`/`@Mutation()` classes and `@ObjectType()`/`@Field()` types to build selection sets and diagnostics; `@nestbridge/runtime` adds a `graphqlRequest` client; `@nestbridge/vite` gains a `resolvers` option that generates client-facing resolver stubs backed by it; `nestbridge` re-exports the new GraphQL API.

### Patch Changes

- Updated dependencies
- Updated dependencies [b28bc2d]
- Updated dependencies [4dea4e9]
  - @nestbridge/runtime@1.0.0
  - @nestbridge/vite@1.0.0
