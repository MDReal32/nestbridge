# @nestbridge/runtime

[![Release](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml)
[![CI](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nestbridge/runtime.svg)](https://www.npmjs.com/package/@nestbridge/runtime)

The browser-side client that NestBridge's generated controller and resolver
modules call into: a `fetch()`-based wrapper for REST and a `fetch()`-based
GraphQL client. No knowledge of NestJS or Vite either way — see the
[repository README](../../README.md) for how this fits into the rest of
NestBridge.

## Install

Generated code and declarations import this package through the
[`nestbridge`](../nestbridge) package, which re-exports all of it, so an app
installs `nestbridge`:

```bash
yarn add nestbridge
```

`@nestbridge/runtime` is the package `nestbridge` builds on; install it
directly only if you are wiring the pieces together yourself.

## Configure once

The base URL comes from the bundler plugin's `baseURL` option. Everything
else is set with `configureNestBridge`:

```ts
import { configureNestBridge } from 'nestbridge';

configureNestBridge({
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
  graphqlEndpoint?: string; // defaults to `${baseURL}/graphql`
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  fetch?: typeof globalThis.fetch;
}
```

## `setNestBridgeBaseURL()`

The base URL is kept apart from `NestBridgeConfig` so that
`configureNestBridge` can never overwrite it. When the plugin's `baseURL`
option is set, the plugin generates a module that calls
`setNestBridgeBaseURL(baseURL)` for you. You can also call it yourself;
`setNestBridgeBaseURL(undefined)` clears it. A relative `graphqlEndpoint` is
resolved against `location.origin` when running in a browser.

## `request()`

Generated controller modules call `request()` directly; you won't normally
call it yourself. Query objects are serialized with `URLSearchParams`
(`undefined`/`null` skipped, arrays repeat the key), a body is sent as JSON, and
a `204`/`205` response or an empty body resolves to `undefined`. Non-2xx
responses reject with a `NestBridgeError` whose message includes the backend's
error message when the body carries one:

```ts
class NestBridgeError<T = unknown> extends Error {
  readonly status: number;
  readonly body: T;
  readonly response: Response;
}
```

## `graphqlRequest()`

Generated resolver modules call `graphqlRequest()` directly; you won't
normally call it yourself either. It POSTs `{ query, variables }` with `fetch`
to `graphqlEndpoint`. It rejects with a `NestBridgeGraphqlError` when the HTTP
status is not 2xx or the response carries GraphQL `errors`:

```ts
class NestBridgeGraphqlError extends Error {
  readonly status: number;
  readonly errors: Array<{ message: string }> | undefined;
  readonly data: unknown;
}
```

## `isNestBridgeError()`

A type guard for narrowing a caught `unknown` error to `NestBridgeError`,
optionally narrowing its `body` too when `@nestbridge/core`'s
`detectErrorResponseShape` statically found your app's global exception
filter's response shape (see the [repository
README](../../README.md#auto-detected-exception-filter-error-body)):

```ts
import { isNestBridgeError } from 'nestbridge';
import type { NestBridgeErrorBody } from '../../.nestbridge/nestbridge-error-body';

try {
  await users.findOne('123');
} catch (error) {
  if (isNestBridgeError<NestBridgeErrorBody>(error)) {
    console.log(error.body.statusCode, error.body.message);
  }
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
- `RemoteObservableResult<T>` / `RemoteStreamResult<T>` — the helpers used for
  methods declared to return an `Observable<T>` (resolves with `T`) or a
  `StreamableFile` (resolves with a `Blob`).

## License

MIT
