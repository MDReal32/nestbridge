---
"@nestbridge/unplugin": patch
"@nestbridge/vite": patch
"@nestbridge/webpack": patch
"nestbridge": patch
---

Fix `yarn add nestbridge` (and `npm install nestbridge`) failing with `Workspace not found (@nestbridge/runtime@workspace:*)`. Previously published manifests shipped Yarn's `workspace:*` dependency specifiers verbatim because the release pipeline packed with plain `npm publish`. Packages are now packed with `yarn pack`, which rewrites them to the real version, and the release aborts if any `workspace:` specifier survives in the tarball.
