# @nestbridge/unplugin

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
