---
"@nestbridge/unplugin": major
"nestbridge": major
---

Every server now has one declaration folder, named after the package at its `root`, with the same layout everywhere. Declarations are written to `<outputDir>/<package name>/`, where `outputDir` is the explicit option, the workspace-root `.nestbridge`, or the project-root `.nestbridge` when there is no workspace. Paths inside the folder mirror the files relative to `root`, so `src/items/items.controller.ts` of a package named `http-server` becomes `.nestbridge/http-server/src/items/items.controller.d.ts`. A scoped name nests (`.nestbridge/@acme/api/`). The error body declaration is `error-body.d.ts` in the same folder (it was `nestbridge-error-body.d.ts` next to the client). The `name` option no longer affects any path: it only names the runtime service.

`root` must point at the server package, and its `package.json` must have a non-empty `name`; otherwise the build fails with an error that says so.

Declarations depend only on the server, so any number of clients of a server write the same files and share one folder. Message methods (`@EventPattern` / `@MessagePattern`) are always written to the declarations; `messagePatterns` now only decides whether the generated client module has the message methods, and whether `unsupported-message-pattern` diagnostics are reported. Every client of a server should state the same `bootstrap` option; when they disagree, the last build wins.

Upgrading:

1. Set `root` to the server package (for example `root: '../server'`) and make the globs relative to it (`controllers: 'src/**/*.controller.ts'`). Give the server's `package.json` a `name`.
2. Change tsconfig `paths` to `.nestbridge/<server package name>/src/*`, for example `"@server/*": ["../../../.nestbridge/http-server/src/*"]`.
3. Change error body imports to `.nestbridge/<server package name>/error-body`.
4. Delete the old `.nestbridge/` output.

See `MIGRATION.md`.
