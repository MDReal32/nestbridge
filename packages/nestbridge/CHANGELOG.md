# nestbridge

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
