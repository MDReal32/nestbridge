---
"@nestbridge/vite": patch
---

Fix generated resolver client methods returning the raw GraphQL `data` envelope (e.g. `{ createBook: { id, title } }`) instead of the requested field's value (`{ id, title }`), so calling a generated resolver method behaves like calling the real one.
