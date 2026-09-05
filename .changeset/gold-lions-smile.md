---
"@nestbridge/runtime": patch
---

Fix `NestBridgeError` swallowing the backend's actual error response. The error `message` now includes the backend's message (or the full response body when no `message` field is present) instead of only a generic status line.
