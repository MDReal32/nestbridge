---
'@nestbridge/unplugin': patch
'nestbridge': patch
---

Write generated declarations under a `<file>.lock` lock, skip unchanged files and replace changed ones atomically, so several apps can safely share one `outputDir`.
