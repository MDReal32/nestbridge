# @nestbridge/runtime

## 1.0.1

### Patch Changes

- Refresh package READMEs to document GraphQL resolver support.

## 1.0.0

### Major Changes

- Release 1.0.0.

### Minor Changes

- 4dea4e9: Add GraphQL resolver support. `@nestbridge/core` statically analyzes `@Resolver()`/`@Query()`/`@Mutation()` classes and `@ObjectType()`/`@Field()` types to build selection sets and diagnostics; `@nestbridge/runtime` adds a `graphqlRequest` client; `@nestbridge/vite` gains a `resolvers` option that generates client-facing resolver stubs backed by it; `nestbridge` re-exports the new GraphQL API.

### Patch Changes

- b28bc2d: Fix `NestBridgeError` swallowing the backend's actual error response. The error `message` now includes the backend's message (or the full response body when no `message` field is present) instead of only a generic status line.
