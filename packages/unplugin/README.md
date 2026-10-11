# @nestbridge/unplugin

[![Release](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml)
[![CI](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nestbridge/unplugin.svg)](https://www.npmjs.com/package/@nestbridge/unplugin)

The bundler-agnostic plugin logic behind NestBridge: discovery of NestJS
controllers and GraphQL resolvers, `.d.ts` declaration writing, and the
code generation that turns an imported controller/resolver into a `fetch()`
call or GraphQL request. It contains no Vite- or
webpack-specific code — bundler bindings are produced by
[`unplugin`](https://github.com/unjs/unplugin), which builds one plugin
implementation into per-bundler outputs.

This package is the engine behind [`@nestbridge/vite`](../vite) and
[`@nestbridge/webpack`](../webpack) and is not usually installed directly;
see the [repository README](../../README.md) for the full picture of how the
pieces fit together.

## Install

```bash
yarn add @nestbridge/unplugin
```

## API

### `nestBridgeUnplugin`

An `unplugin` `UnpluginInstance<NestBridgePluginOptions>` — the options are one
`NestBridgeOptions` object or an array of them, one per server app. Each
property is the same plugin logic, bound to that bundler's plugin shape:

```ts
import { nestBridgeUnplugin } from '@nestbridge/unplugin';

nestBridgeUnplugin.vite(options); // Vite Plugin — used by @nestbridge/vite
nestBridgeUnplugin.webpack(options); // WebpackPluginInstance — used by @nestbridge/webpack
nestBridgeUnplugin.rollup(options); // Rollup Plugin
nestBridgeUnplugin.esbuild(options); // esbuild Plugin
nestBridgeUnplugin.rspack(options); // Rspack Plugin
nestBridgeUnplugin.farm(options); // Farm JsPlugin
```

`@nestbridge/vite` and `@nestbridge/webpack` are thin, typed wrappers around
`.vite` and `.webpack` respectively. The other targets are available from
`unplugin` today but don't yet have a dedicated NestBridge package.

### `NestBridgeOptions`

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
  outputDir?: string;               // defaults to ".nestbridge", resolved from the bundler's own root (Vite's root / webpack's context)
  root?: string;                    // base for the app's files; relative paths resolve against Vite's root (process.cwd() under webpack), which is also the default
}

interface GlobalPrefixOption {
  prefix: string;
  exclude?: (string | { path: string; httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' })[];
}

interface VersioningOption {
  prefix?: string;                  // defaults to "v"; use "" for none
  defaultVersion?: string;          // version of routes that state none
}

type NestBridgePluginOptions = NestBridgeOptions | NestBridgeOptions[];
```

`ResolvedNestBridgeOptions` is the same shape with the defaults filled in; the
plugin factory resolves every entry once, validating the array as it does: an
empty array, a missing or duplicate `name` among several entries, and a `name`
that is not a letter followed by letters, digits, `-` or `_` all fail with an
explicit error.

## What the plugin does

Everything below happens once per entry of the options array — each app is
discovered, analyzed and written out independently, so a build with several
apps behaves like several single-app builds sharing one plugin.

1. On `buildStart`, it globs `controllers`/`resolvers`, runs each file
   through [`@nestbridge/core`](../core)'s static analysis, and writes the
   generated `.d.ts` declarations to `outputDir` — to `<outputDir>/<name>/`
   for a named app — so TypeScript sees a client-facing shape instead of the
   real file. A file matched by the globs of two apps is an error (a warning
   in watch mode) that names both.
2. It also locates the app's bootstrap file — the `bootstrap` option, which
   must exist, or else the single `main.ts` under `root` — and runs it through
   `@nestbridge/core`'s `detectResponseWrapper`, `detectErrorResponseShape`,
   `detectGlobalPrefix` and `detectVersioning`. A registered global response
   interceptor is reflected directly in the generated controller declarations;
   a registered `@Catch` exception filter is written to a fixed
   `nestbridge-error-body.d.ts` file next to them. The prefix and versioning
   are composed into each route's path with `applyApplicationRouting`, unless
   `globalPrefix`/`versioning` state them explicitly (or `false` ignores them),
   which replaces the detection and its diagnostics. Nothing is written when
   nothing is registered — see the [repository README](../../README.md) for
   what's recognized.
3. In the `transform` hook (the plugin runs with `enforce: 'pre'`), it
   replaces the source of each discovered controller or resolver with
   generated code that calls `request()` / `graphqlRequest()` from
   `nestbridge` (which re-exports [`@nestbridge/runtime`](../runtime)) — the
   real source, its NestJS decorators, and its dependencies never enter the
   bundle. For a named app every call carries `service: "<name>"`, which the
   runtime uses to pick that app's origin.
4. When any app sets `baseURL`, a small virtual module
   (`virtual-nestbridge-config`, served through `resolveId`/`load`) registers
   them: `setNestBridgeBaseURL(baseURL)` for an unnamed app,
   `setNestBridgeServiceBaseURL(name, baseURL)` for a named one. Every
   generated controller and resolver module imports it.
5. When a tracked controller, resolver, or bootstrap file changes
   (`watchChange`), it re-analyzes only the app that owns the file and rewrites
   its declarations, including the interceptor, filter, prefix and versioning
   detection.

Diagnostics from `@nestbridge/core` (an unsupported decorator, a
non-literal route path, a global prefix or versioning setup that cannot be
read, etc.) and the plugin's own problems (overlapping apps, a missing
bootstrap file) are thrown during a one-shot build and logged as warnings
during watch mode, so a bad decorator doesn't kill an active dev server.

## License

MIT
