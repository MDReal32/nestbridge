# @nestbridge/vite

A Vite plugin that lets frontend code import a NestJS controller directly —
keeping full TypeScript autocomplete against its real method signatures,
while the browser only ever receives a generated `fetch()` call. See the
[repository README](../../README.md) for the full explanation of how NestJS
is kept out of the client bundle.

## Install

```bash
yarn add -D @nestbridge/vite
yarn add @nestbridge/runtime
```

## Setup

```ts
// vite.config.ts
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { nestBridge } from '@nestbridge/vite';

export default defineConfig({
  resolve: {
    alias: {
      '@server': resolve(__dirname, '../server/src'),
    },
  },
  plugins: [
    nestBridge({
      controllers: '../server/src/**/*.controller.ts',
      baseURL: '/api',
    }),
  ],
});
```

The `resolve.alias` entry lets the bundler find the real controller files so
the plugin can intercept them. A matching `paths` entry in `tsconfig.json`
lets TypeScript find the *generated* declarations instead:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@server/*": ["./.nestbridge/server/src/*"]
    }
  }
}
```

Add `.nestbridge/` (or your configured `outputDir`) to `.gitignore` — it's
regenerated on every build and on every dev-server start.

## `NestBridgeOptions`

```ts
interface NestBridgeOptions {
  controllers: string | string[]; // glob(s), resolved relative to the Vite root
  baseURL?: string;                // informational; call configureNestBridge for the runtime effect
  debug?: boolean;                 // logs discovery/analysis/HMR activity
  outputDir?: string;               // defaults to ".nestbridge"
}
```

Don't forget to call `configureNestBridge` from `@nestbridge/runtime` — this
option only affects generated path text, not the runtime `fetch()` config.

## License

MIT
