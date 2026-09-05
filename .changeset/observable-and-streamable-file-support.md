---
"@nestbridge/core": minor
"@nestbridge/runtime": minor
"@nestbridge/vite": minor
---

Add support for controller methods that return `Observable<T>` or `StreamableFile`. The analyzer now detects these return types (`ResponseKind`), the generated client requests a blob for streamed responses, and `@nestbridge/runtime` exposes `RemoteObservableResult`/`RemoteStreamResult` helper types alongside the existing `RemoteResult`.
