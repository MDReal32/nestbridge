# @nestbridge/runtime

The browser-side `fetch()` client that NestBridge's generated controller
modules call into. Zero dependencies, and no knowledge of NestJS or Vite —
see the [repository README](../../README.md) for how this fits into the rest
of NestBridge.

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

## Types

- `NestBridgeConfig` — the shape passed to `configureNestBridge`.
- `NestBridgeRequest` — the shape of a single generated request.
- `RemoteMethod<T>` / `RemoteResult<T>` — the type-level helpers that project
  a real controller method's parameters and return type onto its generated
  client method. Useful outside code generation too — a manual SDK wrapper, a
  mock, a test double.

## License

MIT
