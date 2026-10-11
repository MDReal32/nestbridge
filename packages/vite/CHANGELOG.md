# @nestbridge/vite

## 2.1.3

### Patch Changes

- cec7886: Fix `Cannot find module '.../typescript/unstable/ast'` when loading `@nestbridge/vite` or `@nestbridge/webpack` in a project that has its own `typescript` (for example 6.x) installed. Each package previously bundled a private copy of its internal `@nestbridge/*` dependencies, so core's `typescript@7` import was resolved against the host project's `typescript` instead of the one core declares. Internal packages are now external, so imports resolve through the declared dependency chain and the bundles shrink accordingly.
- Updated dependencies [cec7886]
  - @nestbridge/unplugin@2.1.3

## 2.1.2

### Patch Changes

- e391e8f: Fix `yarn add nestbridge` (and `npm install nestbridge`) failing with `Workspace not found (@nestbridge/runtime@workspace:*)`. Previously published manifests shipped Yarn's `workspace:*` dependency specifiers verbatim because the release pipeline packed with plain `npm publish`. Packages are now packed with `yarn pack`, which rewrites them to the real version, and the release aborts if any `workspace:` specifier survives in the tarball.
- Updated dependencies [e391e8f]
  - @nestbridge/unplugin@2.1.2

## 2.1.1

### Patch Changes

- c7fe551: Fix `outputDir` resolving relative to `root` instead of the bundler's own project root. `root` now controls only where controllers, resolvers, and the bootstrap `main.ts` are discovered, while `outputDir` always resolves relative to Vite's `config.root` or webpack's `compiler.options.context`. This removes the need to widen `root` to a parent directory just to reach a bootstrap file that lives outside the client project, and fixes webpack builds that previously had no way to resolve their own project root at all.
- Updated dependencies [c7fe551]
  - @nestbridge/unplugin@2.1.1

## 2.1.0

### Patch Changes

- Updated dependencies [a21adfa]
  - @nestbridge/unplugin@2.1.0

## 2.0.4

### Patch Changes

- @nestbridge/unplugin@2.0.4

## 2.0.0

### Patch Changes

- f474d7f: Make the `@nestbridge/vite` plugin's `baseURL` option actually configure the generated client. Every generated controller/resolver module now statically imports a new `virtual:nestbridge/config` module that calls `setNestBridgeBaseURL(...)` before any user code runs, so requests are sent to the configured server without any manual setup.
  
  **Breaking:** `NestBridgeConfig.baseURL` has been removed from `configureNestBridge`. `configureNestBridge` fully replaces its config object rather than merging into it, so a `baseURL` living inside it could be silently wiped out by a later `configureNestBridge({...})` call made for an unrelated reason (e.g. to set `headers`). The base URL is now tracked independently via the new `setNestBridgeBaseURL`/`getNestBridgeBaseURL` functions, which `configureNestBridge` never touches. If you were calling `configureNestBridge({ baseURL: '...' })` directly, call `setNestBridgeBaseURL('...')` instead.
- Updated dependencies [f474d7f]
  - @nestbridge/runtime@2.0.0
  - @nestbridge/core@2.0.0

## 1.1.1

### Patch Changes

- Updated dependencies [020df80]
  - @nestbridge/runtime@1.1.1
  - @nestbridge/core@1.1.1

## 1.1.0

### Minor Changes

- 7336719: Add support for controller methods that return `Observable<T>` or `StreamableFile`. The analyzer now detects these return types (`ResponseKind`), the generated client requests a blob for streamed responses, and `@nestbridge/runtime` exposes `RemoteObservableResult`/`RemoteStreamResult` helper types alongside the existing `RemoteResult`.

### Patch Changes

- 7336719: Fix generated resolver client methods returning the raw GraphQL `data` envelope (e.g. `{ createBook: { id, title } }`) instead of the requested field's value (`{ id, title }`), so calling a generated resolver method behaves like calling the real one.
- Updated dependencies [7336719]
- Updated dependencies [7336719]
  - @nestbridge/core@1.1.0
  - @nestbridge/runtime@1.1.0

## 1.0.1

### Patch Changes

- Refresh package READMEs to document GraphQL resolver support.
- Updated dependencies
  - @nestbridge/core@1.0.1
  - @nestbridge/runtime@1.0.1

## 1.0.0

### Major Changes

- Release 1.0.0.

### Minor Changes

- 4dea4e9: Add GraphQL resolver support. `@nestbridge/core` statically analyzes `@Resolver()`/`@Query()`/`@Mutation()` classes and `@ObjectType()`/`@Field()` types to build selection sets and diagnostics; `@nestbridge/runtime` adds a `graphqlRequest` client; `@nestbridge/vite` gains a `resolvers` option that generates client-facing resolver stubs backed by it; `nestbridge` re-exports the new GraphQL API.

### Patch Changes

- Updated dependencies
- Updated dependencies [b28bc2d]
- Updated dependencies [4dea4e9]
  - @nestbridge/core@1.0.0
  - @nestbridge/runtime@1.0.0
