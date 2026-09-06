# @nestbridge/runtime

## 1.1.1

### Patch Changes

- 020df80: Replace the `graphql-request` dependency with a native `fetch`-based implementation of `graphqlRequest`, matching the existing HTTP adapter's style. `graphql-request@7.4.0`'s peer dependency capped `graphql` at `14 - 16`, which blocked upgrading to `graphql@17`. `NestBridgeGraphqlError`'s public fields (`status`, `errors`, `data`) are unchanged.

## 1.1.0

### Minor Changes

- 7336719: Add support for controller methods that return `Observable<T>` or `StreamableFile`. The analyzer now detects these return types (`ResponseKind`), the generated client requests a blob for streamed responses, and `@nestbridge/runtime` exposes `RemoteObservableResult`/`RemoteStreamResult` helper types alongside the existing `RemoteResult`.

### Patch Changes

- 7336719: Fix `NestBridgeGraphqlError` dumping the raw `{ response, request }` object (headers, query text, variables and all) into its `message`. The message is now a short, readable line — the GraphQL errors' text when present, otherwise the raw response body, otherwise just the endpoint and status.

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
