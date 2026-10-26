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
yarn add nestbridge
```

The generated client modules and declarations import from `nestbridge`, so it
has to be a direct dependency of your app. If you would rather have one
dependency, `yarn add nestbridge` alone is enough: import the plugin from
`nestbridge/webpack` (its default export) instead of `@nestbridge/webpack`.

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
    "paths": {
      "@server/*": ["../../../.nestbridge/apps/web/server/src/*"]
    }
  }
}
```

`paths` entries resolve relative to the `tsconfig.json` that declares them, so
no `baseUrl` is needed (TypeScript 7 removed that option).

Add `.nestbridge/` (or your configured `outputDir`) to `.gitignore` — it's
regenerated on every build and on every dev-server start.

Unlike Vite, webpack has no build-time hook the plugin can use to discover
the project root automatically, so it defaults to `process.cwd()`. Pass an
explicit `root` if `webpack.config.js` runs from somewhere other than the
directory your `controllers`/`resolvers` globs are relative to.

## Several server apps

To use controllers from more than one NestJS app, pass an array — one entry per
app. Each entry needs a `name`, and its `root` should be that app's folder:

```js
nestBridge([
  {
    name: 'identity',
    root: '../identity',
    controllers: 'src/**/*.controller.ts',
    baseURL: 'https://identity.example.com',
  },
  {
    name: 'store',
    root: '../store',
    controllers: 'src/**/*.controller.ts',
    baseURL: 'https://store.example.com',
  },
]);
```

A relative `root` resolves against `process.cwd()`. Declarations land in
`<outputDir>/<name>/`, so add one `resolve.alias` and one `paths` entry per app
(`"@identity/*": ["../../.nestbridge/identity/apps/identity/src/*"]`), and each app keeps its own
`baseURL`, bootstrap file, global prefix and versioning. See
[Several server apps](../../README.md#several-server-apps) in the repository
README, and [`MIGRATION.md`](../../MIGRATION.md) when upgrading from 2.1.

## `NestBridgeOptions`

```ts
interface NestBridgeOptions {
  name?: string;                    // names the server app; required, and unique, when you pass several apps
  controllers: string | string[];   // glob(s), resolved relative to `root`
  resolvers?: string | string[];    // glob(s) for GraphQL resolvers; defaults to none
  baseURL?: string;                 // origin (or mount path) for this app's REST requests and its default GraphQL endpoint; applied to the runtime automatically
  bootstrap?: string;               // the app's bootstrap file, relative to `root`; skips the `main.ts` search
  globalPrefix?: string | GlobalPrefixOption | false; // replaces the prefix read from `setGlobalPrefix()`; `false` ignores it
  versioning?: VersioningOption | false;              // replaces the versioning read from `enableVersioning()`; `false` ignores it
  debug?: boolean;                  // logs discovery/analysis/watch activity
  logLevel?: 'info' | 'warn' | 'error' | 'silent'; // how much the plugin logs; defaults to the bundler's own level (Vite's logLevel, webpack's infrastructureLogging.level)
  outputDir?: string;               // defaults to ".nestbridge" at the workspace root (nearest nx.json / pnpm-workspace.yaml / turbo.json / lerna.json / package.json with "workspaces"), or at the project root when there is no workspace; an explicit value is resolved from the bundler's own root
  root?: string;                    // base for discovering controllers/resolvers and the bootstrap file; relative paths resolve against process.cwd(), which is also the default
}

interface GlobalPrefixOption {
  prefix: string;
  exclude?: (string | { path: string; httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' })[];
}

interface VersioningOption {
  prefix?: string;                  // defaults to "v"; use "" for none
  defaultVersion?: string;          // version of routes that state none
}
```

`nestBridge()` takes a `NestBridgeOptions` object, or an array of them
(`NestBridgePluginOptions`). All of these types are exported.

`baseURL` needs no extra runtime code: the plugin generates a module that
calls `setNestBridgeBaseURL(baseURL)` from `nestbridge` (or
`setNestBridgeServiceBaseURL(name, baseURL)` for a named app), and every
generated controller and resolver module imports it. Use `configureNestBridge`
from `nestbridge` only for headers, a custom `fetch`, an explicit
`graphqlEndpoint`, or per-environment `services` origins.

The global prefix and URI versioning that the app's bootstrap file sets are
read statically and added to every request path, so keep `baseURL` to the
origin — see [Global prefix and URI versioning](../../README.md#global-prefix-and-uri-versioning).

The plugin logs through webpack's own logger, so `infrastructureLogging.level` already applies to its
watch-mode warnings. `logLevel` (`'info'`, `'warn'`, `'error'` or `'silent'`) quiets only NestBridge — see
[Hiding NestBridge logs](../../README.md#hiding-nestbridge-logs).

## License

MIT
