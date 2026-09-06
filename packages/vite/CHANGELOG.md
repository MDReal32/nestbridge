# @nestbridge/vite

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
