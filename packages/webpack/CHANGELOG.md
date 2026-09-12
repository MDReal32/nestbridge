# @nestbridge/webpack

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
