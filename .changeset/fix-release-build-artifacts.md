---
"nestbridge": patch
---

Fix the release workflow's build-artifact hand-off so published packages actually include their `build` directory. Previous releases (up to 2.0.3) were published with an empty `build` folder due to a path-stripping bug in the CI upload/download steps.
