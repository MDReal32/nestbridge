# @nestbridge/unplugin

## 2.1.0

### Minor Changes

- a21adfa: Add static detection of a global response-wrapper interceptor (`app.useGlobalInterceptors(...)`, composing multiple chained interceptors in registration order) and a global `@Catch` exception filter's error response body shape (registered via `app.useGlobalFilters(...)` or an `APP_FILTER` provider). Both are reflected automatically in generated client types with no configuration: a detected response wrapper reshapes the generated controller/resolver return types, and a detected error body is written to `nestbridge-error-body.d.ts` for use with the new `isNestBridgeError()` type guard exported from `@nestbridge/runtime`. Neither writes anything when nothing is registered, or the shape isn't exactly recognized.

### Patch Changes

- Updated dependencies [a21adfa]
  - @nestbridge/core@2.1.0

## 2.0.4

### Patch Changes

- @nestbridge/core@2.0.4
