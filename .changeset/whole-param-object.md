---
"@nestbridge/core": minor
"@nestbridge/unplugin": minor
"nestbridge": minor
---

Support a bare `@Param()` that receives the whole route-parameter object, such as `findPost(@Param() params: PostParams)` for `@Get('posts/:slug')`. It used to be reported as an `unsupported-parameter` diagnostic. The generated client reads each `:token` of the path from the matching property of that object, `encodeURIComponent`-escaped, and a `@Param('name')` on the same method still wins for its own token. `ControllerParameterDefinition` allows an optional `name` for `kind: 'param'`, like `query` and `body`.

A `@Param`, `@Query`, `@Body` or `@Headers` argument that is not a string literal, such as `@Param(ParseIntPipe)`, is still an `unsupported-parameter` diagnostic; a pipe as the second argument is fine.
