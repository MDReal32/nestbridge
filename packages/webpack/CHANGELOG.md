# @nestbridge/webpack

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
