---
"@nestbridge/core": minor
"@nestbridge/runtime": minor
"@nestbridge/unplugin": minor
"@nestbridge/vite": minor
"@nestbridge/webpack": minor
"nestbridge": minor
---

One client can now use controllers from several NestJS apps. `nestBridge()` accepts an array of options, one entry per app, and each entry takes its own `name`, `root`, `controllers`, `resolvers`, `baseURL`, `bootstrap`, `globalPrefix` and `versioning`. A named app writes its declarations to `<outputDir>/<name>/`, detects its own response wrapper and error body from its own bootstrap file, and tags every generated request with its `name` as the `service`. A single object still works as before.

The runtime picks each request's origin from `configureNestBridge({ services })`, then the origin the plugin registered for that app with the new `setNestBridgeServiceBaseURL(name, baseURL)`, then the global `setNestBridgeBaseURL()` value. `graphqlEndpoint` also accepts a record with one endpoint per app.

`@Controller({ path, version })` and `@Version(...)` are now read, and the global prefix (`setGlobalPrefix`, including `exclude`) and URI versioning (`enableVersioning`) are detected from the bootstrap file and composed into every request path with the new `detectGlobalPrefix`, `detectVersioning` and `applyApplicationRouting` from `@nestbridge/core`. A prefix or versioning setup that cannot be read statically is reported as an `unsupported-global-prefix` or `unsupported-versioning` diagnostic; the `globalPrefix` and `versioning` plugin options state the value explicitly, and `false` ignores it.

Upgrading: the global prefix and URI versioning are now part of every URL, so a prefix that was written into `baseURL` as a workaround would now be repeated. Keep `baseURL` to the origin, or set `globalPrefix: false` / `versioning: false`. A relative `root` now resolves against the bundler's root instead of `process.cwd()`. See `MIGRATION.md`.
