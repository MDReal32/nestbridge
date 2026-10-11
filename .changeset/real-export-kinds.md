---
"nestbridge": patch
"@nestbridge/runtime": patch
---

Make editors show the real kind (function, class, interface, type) for every `nestbridge` export instead of a generic icon in import autocomplete. The package entry now star re-exports `@nestbridge/runtime`, and the runtime declares its types inline instead of in a trailing `export type {}` block, so TypeScript no longer reports each symbol as an alias.

`nestbridge` now also exports `RemoteObservableResult` and `RemoteStreamResult`, which generated declarations for `Observable<T>` and `StreamableFile` controller methods import from `nestbridge` but the package did not previously export.

The README files are updated to match the current API: install `nestbridge`, `baseURL` is a plugin option applied to the runtime automatically, GraphQL uses plain `fetch`, and the Observable and `StreamableFile` support is documented.
