# @nestbridge/runtime

[![CI](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nestbridge/runtime.svg)](https://www.npmjs.com/package/@nestbridge/runtime)

The browser-side client that NestBridge's generated controller and resolver
modules call into: a dependency-free `fetch()` wrapper for REST, and a
[`graphql-request`](https://github.com/jasonkuhrt/graphql-request)-based
client for GraphQL. No knowledge of NestJS or Vite either way — see the
[repository README](../../README.md) for how this fits into the rest of
NestBridge.

## Install

```bash
yarn add @nestbridge/runtime
```

## Configure once

```ts
import { configureNestBridge } from '@nestbridge/runtime';

configureNestBridge({
  baseURL: '/api',
  async headers() {
    return { authorization: `Bearer ${getToken()}` };
  },
});
```

Call this once, before your first request — typically at the top of your
app's entry point. `configureNestBridge` replaces the whole config rather
than merging, so pass everything you need in one call.

```ts
interface NestBridgeConfig {
  baseURL?: string;
  graphqlEndpoint?: string; // defaults to `${baseURL}/graphql`
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  fetch?: typeof globalThis.fetch;
}
```

## `request()`

Generated controller modules call `request()` directly; you won't normally
call it yourself. Non-2xx responses reject with a `NestBridgeError`:

```ts
class NestBridgeError<T = unknown> extends Error {
  readonly status: number;
  readonly body: T;
  readonly response: Response;
}
```

## `graphqlRequest()`

Generated resolver modules call `graphqlRequest()` directly; you won't
normally call it yourself either. It sends the given document/variables to
`graphqlEndpoint` via `graphql-request`'s `GraphQLClient`. Failed requests
reject with a `NestBridgeGraphqlError`:

```ts
class NestBridgeGraphqlError extends Error {
  readonly status: number;
  readonly errors: GraphQLError[] | undefined;
  readonly data: Record<string, unknown> | undefined;
  readonly request: unknown;
}
```

## Types

- `NestBridgeConfig` — the shape passed to `configureNestBridge`.
- `NestBridgeRequest` — the shape of a single generated REST request.
- `NestBridgeGraphqlRequest` — the shape of a single generated GraphQL
  request (`document` + optional `variables`).
- `RemoteMethod<T>` / `RemoteResult<T>` — the type-level helpers that project
  a real controller or resolver method's parameters and return type onto its
  generated client method. Useful outside code generation too — a manual SDK
  wrapper, a mock, a test double.

## License

MIT
