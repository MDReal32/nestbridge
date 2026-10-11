---
"@nestbridge/unplugin": patch
"@nestbridge/vite": patch
"@nestbridge/webpack": patch
---

Fix `Cannot find module '.../typescript/unstable/ast'` when loading `@nestbridge/vite` or `@nestbridge/webpack` in a project that has its own `typescript` (for example 6.x) installed. Each package previously bundled a private copy of its internal `@nestbridge/*` dependencies, so core's `typescript@7` import was resolved against the host project's `typescript` instead of the one core declares. Internal packages are now external, so imports resolve through the declared dependency chain and the bundles shrink accordingly.
