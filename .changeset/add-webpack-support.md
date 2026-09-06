---
"@nestbridge/vite": minor
"nestbridge": minor
---

Extract the bundler-agnostic virtual-module and codegen logic out of `@nestbridge/vite` into a new `@nestbridge/unplugin` package built on `unplugin`, and add a new `@nestbridge/webpack` package plus a matching `nestbridge/webpack` facade subpath. `@nestbridge/vite` keeps its existing public API and is now a thin wrapper over the shared factory; it also gains an optional `root` option.
