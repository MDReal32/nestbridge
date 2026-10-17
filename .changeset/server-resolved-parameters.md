---
'@nestbridge/core': patch
'nestbridge': patch
---

Treat parameters carrying a custom decorator (for example `@CurrentUser()`) as server-resolved: they no longer drop the method from the generated client, and are left out of the generated method signature.
