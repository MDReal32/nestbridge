# @nestbridge/core

[![Release](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml)
[![CI](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nestbridge/core.svg)](https://www.npmjs.com/package/@nestbridge/core)

Static analysis of NestJS controllers and GraphQL resolvers, and generation
of the client-facing `.d.ts` declarations that make them safely importable
from the browser.

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

### `analyzeResolvers(filePaths)`

Parses each file, finds classes decorated with `@Resolver(...)`, and
extracts a plain `ResolverDefinition` per resolver — its name, and each
`@Query`/`@Mutation` method's operation kind (`'query'` | `'mutation'`),
operation name, `@Args()` parameter mapping (name, GraphQL type), and a
`selection` of `SelectionField`s built by walking the return type's
`@ObjectType()` fields. The return type itself is read from the
`@Query()`/`@Mutation()` type-thunk argument (`() => UserType`) first,
falling back to a TypeScript return-type annotation only when no thunk is
present — a resolver method never needs both.

```ts
import { analyzeResolvers } from '@nestbridge/core';

const { resolvers, diagnostics } = analyzeResolvers([
  'src/users/users.resolver.ts',
]);
```

### `generateControllerDeclaration(definition, outputFilePath)`

Turns a `ControllerDefinition` or a `ResolverDefinition` into the text of a
`.d.ts` file — both share the same `{ name, sourceFile, methods }` shape, so
the same generator is used for both. The generated class re-declares each
method using a type-only reference back to the real controller or resolver
(`Parameters<__ServerX['method']>` / `RemoteResult<...>`), so argument and
return types are projected from the real class's own type — never re-derived
from the AST.

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
`ResolverDefinition`, `ResolverMethodDefinition`,
`ResolverArgumentDefinition`, `SelectionField`, `GraphqlOperationKind`,
`NestBridgeDiagnostic`, `NestBridgeDiagnosticCode`.

## License

MIT
