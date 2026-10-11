---
"@nestbridge/unplugin": minor
"@nestbridge/vite": minor
"@nestbridge/webpack": minor
"nestbridge": minor
---

Add a `logLevel` plugin option (`'info' | 'warn' | 'error' | 'silent'`, the same values as Vite's) to quiet NestBridge's output, for example the watch-mode diagnostics that are logged as warnings so the dev server keeps running. `'error'` and `'silent'` hide those warnings, and `'warn'` and below hide `debug` messages. The level is set per app, and an unknown value fails with an explicit error. The `NestBridgeLogLevel` type is exported.

The plugin now reports through the bundler's own logger instead of the console — Vite's `config.logger` and webpack's infrastructure logger — so Vite's `logLevel` and `customLogger`, and webpack's `infrastructureLogging.level`, apply to NestBridge without any option. Other bundlers still use the console. Diagnostics that fail a one-shot build are thrown and are not affected by the level.
