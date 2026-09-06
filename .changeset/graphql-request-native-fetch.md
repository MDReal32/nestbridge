---
"@nestbridge/runtime": patch
---

Replace the `graphql-request` dependency with a native `fetch`-based implementation of `graphqlRequest`, matching the existing HTTP adapter's style. `graphql-request@7.4.0`'s peer dependency capped `graphql` at `14 - 16`, which blocked upgrading to `graphql@17`. `NestBridgeGraphqlError`'s public fields (`status`, `errors`, `data`) are unchanged.
