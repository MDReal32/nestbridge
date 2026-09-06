# @nestbridge/webpack

[![Release](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml)
[![CI](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nestbridge/webpack.svg)](https://www.npmjs.com/package/@nestbridge/webpack)

A webpack plugin that lets frontend code import a NestJS controller or
GraphQL resolver directly — keeping full TypeScript autocomplete against its
real method signatures, while the browser only ever receives a generated
`fetch()` call or GraphQL request. See the [repository README](../../README.md)
for the full explanation of how NestJS is kept out of the client bundle.

This plugin is a thin `webpack` binding around the bundler-agnostic
[`@nestbridge/unplugin`](../unplugin) engine — the same one that
[`@nestbridge/vite`](../vite) wraps for Vite — so discovery, code generation,
and declaration writing behave identically across both bundlers.

## Install

```bash
yarn add -D @nestbridge/webpack
yarn add @nestbridge/runtime
```

## Setup

```js
// webpack.config.js
const { resolve } = require('node:path');
const { nestBridge } = require('@nestbridge/webpack');

module.exports = {
  resolve: {
    alias: {
      '@server': resolve(__dirname, '../server/src'),
    },
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: 'esbuild-loader' }],
  },
  plugins: [
    nestBridge({
      controllers: '../server/src/**/*.controller.ts',
      resolvers: '../server/src/**/*.resolver.ts',
      baseURL: '/api',
    }),
  ],
};
```

`resolvers` is optional — omit it if your app has no GraphQL resolvers. The
`resolve.alias` entry lets webpack find the real controller and resolver
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

Unlike Vite, webpack has no build-time hook the plugin can use to discover
the project root automatically, so it defaults to `process.cwd()`. Pass an
explicit `root` if `webpack.config.js` runs from somewhere other than the
directory your `controllers`/`resolvers` globs are relative to.

## `NestBridgeOptions`

```ts
interface NestBridgeOptions {
  controllers: string | string[]; // glob(s), resolved relative to `root`
  resolvers?: string | string[];   // glob(s) for GraphQL resolvers; defaults to none
  baseURL?: string;                // informational; call configureNestBridge for the runtime effect
  debug?: boolean;                 // logs discovery/analysis/HMR activity
  outputDir?: string;               // defaults to ".nestbridge"
  root?: string;                    // defaults to process.cwd()
}
```

Don't forget to call `configureNestBridge` from `@nestbridge/runtime` — this
option only affects generated path text, not the runtime `fetch()`/GraphQL
config (`baseURL`/`graphqlEndpoint`).

## License

MIT
