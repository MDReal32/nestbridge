---
"@nestbridge/runtime": patch
---

Fix `NestBridgeGraphqlError` dumping the raw `{ response, request }` object (headers, query text, variables and all) into its `message`. The message is now a short, readable line — the GraphQL errors' text when present, otherwise the raw response body, otherwise just the endpoint and status.
