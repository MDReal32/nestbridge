# @nestbridge/webpack

## 2.4.1

### Patch Changes

- @nestbridge/unplugin@2.4.1

## 2.4.0

### Minor Changes

- bb0f3a9: Add a `logLevel` plugin option (`'info' | 'warn' | 'error' | 'silent'`, the same values as Vite's) to quiet NestBridge's output, for example the watch-mode diagnostics that are logged as warnings so the dev server keeps running. `'error'` and `'silent'` hide those warnings, and `'warn'` and below hide `debug` messages. The level is set per app, and an unknown value fails with an explicit error. The `NestBridgeLogLevel` type is exported.
  
  The plugin now reports through the bundler's own logger instead of the console — Vite's `config.logger` and webpack's infrastructure logger — so Vite's `logLevel` and `customLogger`, and webpack's `infrastructureLogging.level`, apply to NestBridge without any option. Other bundlers still use the console. Diagnostics that fail a one-shot build are thrown and are not affected by the level.

### Patch Changes

- Updated dependencies [2f13b42]
- Updated dependencies [bb0f3a9]
  - @nestbridge/unplugin@2.4.0

## 2.3.0

### Patch Changes

- Updated dependencies [1ca473c]
  - @nestbridge/unplugin@2.3.0

## 2.2.0

### Minor Changes

- 98349c7: One client can now use controllers from several NestJS apps. `nestBridge()` accepts an array of options, one entry per app, and each entry takes its own `name`, `root`, `controllers`, `resolvers`, `baseURL`, `bootstrap`, `globalPrefix` and `versioning`. A named app writes its declarations to `<outputDir>/<name>/`, detects its own response wrapper and error body from its own bootstrap file, and tags every generated request with its `name` as the `service`. A single object still works as before.
  
  The runtime picks each request's origin from `configureNestBridge({ services })`, then the origin the plugin registered for that app with the new `setNestBridgeServiceBaseURL(name, baseURL)`, then the global `setNestBridgeBaseURL()` value. `graphqlEndpoint` also accepts a record with one endpoint per app.
  
  `@Controller({ path, version })` and `@Version(...)` are now read, and the global prefix (`setGlobalPrefix`, including `exclude`) and URI versioning (`enableVersioning`) are detected from the bootstrap file and composed into every request path with the new `detectGlobalPrefix`, `detectVersioning` and `applyApplicationRouting` from `@nestbridge/core`. A prefix or versioning setup that cannot be read statically is reported as an `unsupported-global-prefix` or `unsupported-versioning` diagnostic; the `globalPrefix` and `versioning` plugin options state the value explicitly, and `false` ignores it.
  
  Upgrading: the global prefix and URI versioning are now part of every URL, so a prefix that was written into `baseURL` as a workaround would now be repeated. Keep `baseURL` to the origin, or set `globalPrefix: false` / `versioning: false`. A relative `root` now resolves against the bundler's root instead of `process.cwd()`. See `MIGRATION.md`.

### Patch Changes

- Updated dependencies [98349c7]
  - @nestbridge/unplugin@2.2.0

## 2.1.4

### Patch Changes

- @nestbridge/unplugin@2.1.4

## 2.1.3

### Patch Changes

- cec7886: Fix `Cannot find module '.../typescript/unstable/ast'` when loading `@nestbridge/vite` or `@nestbridge/webpack` in a project that has its own `typescript` (for example 6.x) installed. Each package previously bundled a private copy of its internal `@nestbridge/*` dependencies, so core's `typescript@7` import was resolved against the host project's `typescript` instead of the one core declares. Internal packages are now external, so imports resolve through the declared dependency chain and the bundles shrink accordingly.
- Updated dependencies [cec7886]
  - @nestbridge/unplugin@2.1.3

## 2.1.2

### Patch Changes

- e391e8f: Fix `yarn add nestbridge` (and `npm install nestbridge`) failing with `Workspace not found (@nestbridge/runtime@workspace:*)`. Previously published manifests shipped Yarn's `workspace:*` dependency specifiers verbatim because the release pipeline packed with plain `npm publish`. Packages are now packed with `yarn pack`, which rewrites them to the real version, and the release aborts if any `workspace:` specifier survives in the tarball.
- Updated dependencies [e391e8f]
  - @nestbridge/unplugin@2.1.2

## 2.1.1

### Patch Changes

- c7fe551: Fix `outputDir` resolving relative to `root` instead of the bundler's own project root. `root` now controls only where controllers, resolvers, and the bootstrap `main.ts` are discovered, while `outputDir` always resolves relative to Vite's `config.root` or webpack's `compiler.options.context`. This removes the need to widen `root` to a parent directory just to reach a bootstrap file that lives outside the client project, and fixes webpack builds that previously had no way to resolve their own project root at all.
- Updated dependencies [c7fe551]
  - @nestbridge/unplugin@2.1.1

## 2.1.0

### Patch Changes

- Updated dependencies [a21adfa]
  - @nestbridge/unplugin@2.1.0

## 2.0.4

### Patch Changes

- @nestbridge/unplugin@2.0.4
