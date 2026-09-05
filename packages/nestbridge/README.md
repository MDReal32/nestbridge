# nestbridge

A single-package convenience entry point for NestBridge. It re-exports the
runtime API and the Vite plugin so you can depend on one package instead of
wiring up `@nestbridge/runtime` and `@nestbridge/vite` separately. See the
[repository README](../../README.md) for the full explanation of what
NestBridge does and how it works.

## Install

```bash
yarn add nestbridge
```

## Usage

```ts
import { configureNestBridge } from 'nestbridge';

configureNestBridge({ baseURL: '/api' });
```

```ts
// vite.config.ts
import nestBridge from 'nestbridge/vite';

export default defineConfig({
  plugins: [
    nestBridge({
      controllers: '../server/src/**/*.controller.ts',
      baseURL: '/api',
    }),
  ],
});
```

## Exports

- `nestbridge` re-exports `@nestbridge/runtime`'s public API: `configureNestBridge`,
  `request`, `NestBridgeError`, and the `NestBridgeConfig` / `NestBridgeRequest`
  / `RemoteMethod` / `RemoteResult` types.
- `nestbridge/vite` re-exports `@nestbridge/vite`'s `nestBridge` plugin as its
  default export, plus the `NestBridgeOptions` type.

If you need the lower-level static-analysis package directly, install
`@nestbridge/core` on its own — it isn't re-exported here since it's an
implementation detail of `@nestbridge/vite`, not part of the public
runtime/plugin surface.

## License

MIT
