# @nestbridge/core

[![CI](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nestbridge/core.svg)](https://www.npmjs.com/package/@nestbridge/core)

Static analysis of NestJS controllers, and generation of the client-facing
`.d.ts` declarations that make them safely importable from the browser.

This package has no runtime dependency on NestJS, Vite, or the DOM — it reads
TypeScript source text via the TypeScript Compiler API and never executes
your code. It's the engine behind `@nestbridge/vite` and is not usually
installed directly; see the [repository README](../../README.md) for the
full picture of how the pieces fit together.

## Install

```bash
yarn add @nestbridge/core
```

## API

### `analyzeControllers(filePaths)`

Parses each file, finds classes decorated with `@Controller(...)`, and
extracts a plain `ControllerDefinition` per controller — its base path, and
each `@Get`/`@Post`/`@Put`/`@Patch`/`@Delete` method's HTTP method, route
path, and `@Param`/`@Query`/`@Body`/`@Headers` parameter mapping. Anything it
can't safely resolve statically (a non-literal route path, an unsupported
decorator) becomes a `NestBridgeDiagnostic` instead of a guess.

```ts
import { analyzeControllers } from '@nestbridge/core';

const { controllers, diagnostics } = analyzeControllers([
  'src/users/users.controller.ts',
]);
```

### `generateControllerDeclaration(controller, outputFilePath)`

Turns a `ControllerDefinition` into the text of a `.d.ts` file. The generated
class re-declares each method using a type-only reference back to the real
controller (`Parameters<__ServerX['method']>` / `RemoteResult<...>`), so
argument and return types are projected from the real controller's own type —
never re-derived from the AST.

```ts
import { generateControllerDeclaration } from '@nestbridge/core';

const source = generateControllerDeclaration(controller, outputPath);
```

### Diagnostics

```ts
import { formatDiagnostic, NestBridgeDiagnosticError } from '@nestbridge/core';
```

`formatDiagnostic` renders a `NestBridgeDiagnostic` as a human-readable
string (file, position, message). `NestBridgeDiagnosticError` wraps one or
more diagnostics as a thrown `Error`.

### Types

`ControllerDefinition`, `ControllerMethodDefinition`,
`ControllerParameterDefinition`, `HttpMethod`, `ParameterSourceKind`,
`NestBridgeDiagnostic`, `NestBridgeDiagnosticCode`.

## License

MIT
