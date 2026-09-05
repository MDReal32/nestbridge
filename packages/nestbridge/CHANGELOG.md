# nestbridge

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
