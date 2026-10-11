# @nestbridge/vite

[![Release](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml)
[![CI](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nestbridge/vite.svg)](https://www.npmjs.com/package/@nestbridge/vite)

A Vite plugin that lets frontend code import a NestJS controller or GraphQL
resolver directly — keeping full TypeScript autocomplete against its real
method signatures, while the browser only ever receives a generated
`fetch()` call or GraphQL request. See the [repository README](../../README.md)
for the full explanation of how NestJS is kept out of the client bundle.

This plugin is a thin `vite` binding around the bundler-agnostic
[`@nestbridge/unplugin`](../unplugin) engine — the same one that
[`@nestbridge/webpack`](../webpack) wraps for webpack.

## Install

```bash
yarn add -D @nestbridge/vite
yarn add nestbridge
```

The generated client modules and declarations import from `nestbridge`, so it
has to be a direct dependency of your app. If you would rather have one
dependency, `yarn add nestbridge` alone is enough: import the plugin from
`nestbridge/vite` (its default export) instead of `@nestbridge/vite`.

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
      resolvers: '../server/src/**/*.resolver.ts',
      baseURL: '/api',
    }),
  ],
});
```

`resolvers` is optional — omit it if your app has no GraphQL resolvers. The
`resolve.alias` entry lets the bundler find the real controller and resolver
files so the plugin can intercept them. A matching `paths` entry in
`tsconfig.json` lets TypeScript find the *generated* declarations instead:

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
  controllers: string | string[]; // glob(s), resolved relative to `root`
  resolvers?: string | string[];   // glob(s) for GraphQL resolvers; defaults to none
  baseURL?: string;                // prefix for REST requests and the default GraphQL endpoint; applied to the runtime automatically
  debug?: boolean;                 // logs discovery/analysis/watch activity
  outputDir?: string;               // defaults to ".nestbridge", resolved from the Vite root — independent of `root`
  root?: string;                    // base for discovering controllers/resolvers and the bootstrap file; defaults to the Vite root
}
```

Using webpack instead of Vite? See [`@nestbridge/webpack`'s README](../webpack/README.md)
for the equivalent setup — same options, same generated output, different
bundler.

`baseURL` needs no extra runtime code: the plugin generates a module that
calls `setNestBridgeBaseURL(baseURL)` from `nestbridge`, and every generated
controller and resolver module imports it. Use `configureNestBridge` from
`nestbridge` only for headers, a custom `fetch`, or an explicit
`graphqlEndpoint`.

## License

MIT
