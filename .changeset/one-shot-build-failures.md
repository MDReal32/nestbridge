---
'@nestbridge/unplugin': patch
'nestbridge': patch
---

Fail one-shot builds on NestBridge problems and diagnostics, as documented. unplugin never told the plugin whether the bundler was watching, so `vite build` and webpack builds without `--watch` only logged them as warnings and exited successfully. The plugin now reads it from Vite's resolved config (`command` and `build.watch`) and from webpack's `compiler.watchMode`. The Vite dev server, Vitest, `vite build --watch`, webpack `--watch` and webpack-dev-server still only warn.

Upgrading: a one-shot build that printed `[nestbridge]` warnings now fails on them. Fix the reported source, or state the value in the options.
