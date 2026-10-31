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
  graphqlEndpoint?: string | Record<string, string>; // defaults to `${baseURL}/graphql`; a record gives one endpoint per app name
  services?: Record<string, string>; // origin per app name; wins over the plugin's `baseURL` for that app
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  fetch?: typeof globalThis.fetch;
}
```

A string `graphqlEndpoint` applies to every GraphQL request. A record is keyed
by the `name` of a server app; an app without an entry uses its own origin plus
`/graphql`.

## `setNestBridgeBaseURL()`

The base URL is kept apart from `NestBridgeConfig` so that
`configureNestBridge` can never overwrite it. When the plugin's `baseURL`
option is set, the plugin generates a module that calls
`setNestBridgeBaseURL(baseURL)` for you. You can also call it yourself;
`setNestBridgeBaseURL(undefined)` clears it. A relative `graphqlEndpoint` is
resolved against `location.origin` when running in a browser.

## `setNestBridgeServiceBaseURL()`

When the plugin is given [several server apps](../../README.md#several-server-apps),
every generated request carries the `name` of the app it belongs to — its
`service` — and each app registers its own origin:
`setNestBridgeServiceBaseURL('identity', 'https://identity.example.com')`. The
plugin generates those calls from each entry's `baseURL`; call it yourself to
register or replace an origin, and pass `undefined` as the second argument to
remove one.

The origin of a request is the first of these that is set:

1. `services[service]` from `configureNestBridge`
2. the origin registered with `setNestBridgeServiceBaseURL(service, ...)`
3. the global `setNestBridgeBaseURL()` value
4. none — the request goes to the bare route path

A request without a `service` (a single unnamed app) uses only the last two.
`services` is the place to pick origins per environment:

```ts
configureNestBridge({
  services: {
    identity: import.meta.env.VITE_IDENTITY_URL,
    store: import.meta.env.VITE_STORE_URL,
  },
});
```

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

`request()` returns an `AbortablePromise`: a `Promise` with an `abort(reason?)`
method that aborts the `fetch` and rejects with an `AbortError` (or `reason`).
See [Cancelling a call](../../README.md#cancelling-a-call).

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

`graphqlRequest()` returns an `AbortablePromise` too. When the request sets
`field`, it resolves with that root field of the response `data` instead of the
whole `data` object — generated resolver methods use it, so `abort()` reaches
the caller unchanged.

## `isNestBridgeError()`

A type guard for narrowing a caught `unknown` error to `NestBridgeError`,
optionally narrowing its `body` too when `@nestbridge/core`'s
`detectErrorResponseShape` statically found your app's global exception
filter's response shape (see the [repository
README](../../README.md#auto-detected-exception-filter-error-body)):

```ts
import { isNestBridgeError } from 'nestbridge';
import type { NestBridgeErrorBody } from '../../../.nestbridge/web-server/error-body';

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
- `NestBridgeRequest` — the shape of a single generated REST request, with an
  optional `service` naming the server app it belongs to.
- `NestBridgeGraphqlRequest` — the shape of a single generated GraphQL
  request (`document` + optional `variables`, `field` and `service`).
- `AbortablePromise<T>` — the `Promise<T>` with an `abort(reason?)` method that
  every call returns.
- `RemoteMethod<T>` / `RemoteResult<T>` — the type-level helpers that project
  a real controller or resolver method's parameters and return type onto its
  generated client method. Useful outside code generation too — a manual SDK
  wrapper, a mock, a test double.
- `RemoteObservableResult<T>` / `RemoteStreamResult<T>` — the helpers used for
  methods declared to return an `Observable<T>` (resolves with `T`) or a
  `StreamableFile` (resolves with a `Blob`). All three resolve through an
  `AbortablePromise`.

## Microservices (`@nestbridge/runtime/microservices`)

The client side of `@EventPattern` / `@MessagePattern` handlers, re-exported
as `nestbridge/microservices`. It needs `@nestjs/microservices`, an optional
peer dependency; the main entry never imports it.

```ts
import { Transport } from '@nestjs/microservices';
import { configureNestBridgeMicroservices } from 'nestbridge/microservices';

configureNestBridgeMicroservices({
  clients: { billing: { transport: Transport.TCP, options: { port: 3601 } } },
  defaultClient: (service) => ({ transport: Transport.TCP, options: { host: service } }),
});
```

- `configureNestBridgeMicroservices({ clients?, defaultClient? })` — `clients`
  maps an app `name` to `ClientOptions` or a ready `ClientProxy`;
  `defaultClient(service)` builds options for every other service. Throws once
  a client is in use.
- `closeNestBridgeMicroservices()` — closes every client and allows
  configuring again.
- `emitMessage({ service, pattern, payload })` / `sendMessage({ service, pattern, payload })` —
  what generated event and message methods call. A client is created on first
  use per service; a service without one rejects with a
  `NestBridgeMicroserviceError` carrying its `service`.
- `NestBridgeMessageResult<T>` — the result type of a generated message method:
  the handler's return type with `Promise` unwrapped and `Observable<V>` read
  as `V`.

## License

MIT
