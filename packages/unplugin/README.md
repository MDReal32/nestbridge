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

An `unplugin` `UnpluginInstance<NestBridgeOptions>`. Each property is the
same plugin logic, bound to that bundler's plugin shape:

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
  controllers: string | string[]; // glob(s), resolved relative to `root`
  resolvers?: string | string[];   // glob(s) for GraphQL resolvers; defaults to none
  baseURL?: string;                // prefix for REST requests and the default GraphQL endpoint; applied to the runtime automatically
  debug?: boolean;                 // logs discovery/analysis/watch activity
  outputDir?: string;               // defaults to ".nestbridge", resolved from the bundler's own root (Vite's root / webpack's context)
  root?: string;                    // defaults to Vite's root, or process.cwd() under webpack
}
```

`resolveNestBridgeOptions` fills in the defaults above and is what the
plugin factory calls internally; it's exported for bundler bindings (or
tests) that need the resolved shape ahead of time.

## What the plugin does

1. On `buildStart`, it globs `controllers`/`resolvers`, runs each file
   through [`@nestbridge/core`](../core)'s static analysis, and writes the
   generated `.d.ts` declarations to `outputDir` so TypeScript sees a
   client-facing shape instead of the real file.
2. It also discovers a single bootstrap file (`main.ts`) under `root` and
   runs it through `@nestbridge/core`'s `detectResponseWrapper` and
   `detectErrorResponseShape`. A registered global response interceptor is
   reflected directly in the generated controller declarations; a
   registered `@Catch` exception filter is written to a fixed
   `nestbridge-error-body.d.ts` file in `outputDir`. Neither writes anything
   when nothing is registered — see the [repository
   README](../../README.md) for what's recognized.
3. In the `transform` hook (the plugin runs with `enforce: 'pre'`), it
   replaces the source of each discovered controller or resolver with
   generated code that calls `request()` / `graphqlRequest()` from
   `nestbridge` (which re-exports [`@nestbridge/runtime`](../runtime)) — the
   real source, its NestJS decorators, and its dependencies never enter the
   bundle.
4. When `baseURL` is set, a small virtual module (`virtual-nestbridge-config`,
   served through `resolveId`/`load`) calls `setNestBridgeBaseURL(baseURL)`;
   every generated controller and resolver module imports it.
5. When a tracked controller, resolver, or bootstrap file changes
   (`watchChange`), it re-runs the analysis and rewrites the declarations,
   including the interceptor/filter detection.

Diagnostics from `@nestbridge/core` (an unsupported decorator, a
non-literal route path, etc.) are thrown during a one-shot build and logged
as warnings during watch mode, so a bad decorator doesn't kill an active dev
server.

## License

MIT
