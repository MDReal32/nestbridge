---
'@nestbridge/unplugin': minor
'nestbridge': minor
---

Generate `.nestbridge/` at the workspace root by default (the nearest ancestor with `nx.json`, `pnpm-workspace.yaml`, `turbo.json`, `lerna.json` or a `package.json` with `workspaces`), shared by every app, and fall back to the project root when there is no workspace. Declarations are mirrored relative to the workspace root so servers in different folders never collide, and each client's `nestbridge-error-body.d.ts` lives under its own folder.

Upgrading: update your `tsconfig` `paths` (and any `nestbridge-error-body` import) to the new location, or set `outputDir` explicitly to keep the previous per-project layout.
