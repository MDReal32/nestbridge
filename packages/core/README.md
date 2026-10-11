# @nestbridge/core

[![Release](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml)
[![CI](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nestbridge/core.svg)](https://www.npmjs.com/package/@nestbridge/core)

Static analysis of NestJS controllers and GraphQL resolvers, and generation
of the client-facing `.d.ts` declarations that make them safely importable
from the browser.

This package has no runtime dependency on NestJS, Vite, webpack, or the DOM
— it reads TypeScript source text via the TypeScript Compiler API and never
executes your code. It's the static-analysis engine behind
[`@nestbridge/unplugin`](../unplugin) (and, through it,
`@nestbridge/vite`/`@nestbridge/webpack`) and is not usually installed
directly; see the [repository README](../../README.md) for the full picture
of how the pieces fit together.

## Install

```bash
yarn add @nestbridge/core
```

## API

### `analyzeControllers(filePaths)`

Parses each file, finds classes decorated with `@Controller(...)`, and
extracts a plain `ControllerDefinition` per controller — its base path, and
each `@Get`/`@Post`/`@Put`/`@Patch`/`@Delete` method's HTTP method, route
path, `version`, `@Param`/`@Query`/`@Body`/`@Headers` parameter mapping, and
`responseKind` (`'json'`, `'observable'` for an `Observable<T>` return type, or
`'stream'` for `StreamableFile`), read from the method's declared return type.
Both `@Controller('path')` and `@Controller({ path, version })` are read, and
a method's `@Version(...)` replaces its controller's version. A method's
`version` is a string, `null` for `VERSION_NEUTRAL`, or `undefined` when the
route states none (an array of versions uses its first entry). Anything it
can't safely resolve statically (a non-literal route path or version, an
unsupported decorator) becomes a `NestBridgeDiagnostic` instead of a guess.

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

### `generateControllerDeclaration(definition, outputFilePath, responseWrapper?)`

Turns a `ControllerDefinition` or a `ResolverDefinition` into the text of a
`.d.ts` file — both share the same `{ name, sourceFile, methods }` shape, so
the same generator is used for both. The generated class re-declares each
method using a type-only reference back to the real controller or resolver
(`Parameters<__ServerX['method']>` / `RemoteResult<...>`, or
`RemoteObservableResult<...>` / `RemoteStreamResult<...>` for observable and
streamed methods), so argument and return types are projected from the real
class's own type — never re-derived from the AST. Pass the result of
`detectResponseWrapper` as `responseWrapper` to wrap the JSON-returning
methods in the detected response shape (an `AbortablePromise` of it). The helper
types are imported from `'nestbridge'`.

```ts
import { generateControllerDeclaration } from '@nestbridge/core';

const source = generateControllerDeclaration(controller, outputPath);
```

### `detectResponseWrapper(bootstrapFilePath)`

Statically detects `app.useGlobalInterceptors(...)` registrations in the
bootstrap file whose `intercept()` method reshapes every response through a
single recognized `next.handle().pipe(map(...))` call, composing multiple
chained interceptors in registration order, and returns the resulting
wrapped-response type source. Returns `undefined` when no interceptor is
registered, or the shape isn't exactly recognized — see the [repository
README](../../README.md#auto-detected-global-response-wrapper) for the full
rules.

```ts
import { detectResponseWrapper } from '@nestbridge/core';

const responseWrapper = detectResponseWrapper('src/main.ts');
```

### `detectErrorResponseShape(bootstrapFilePath)`

Statically detects a single global `@Catch(...)` exception filter —
registered via `app.useGlobalFilters(...)` or an `APP_FILTER` provider on the
root module — whose `catch()` method reshapes the error through a single
recognized `.json(...)`/`.send(...)` call, and returns the resulting error
body type source. Returns `undefined` when no filter is registered, or the
shape isn't exactly recognized — see the [repository
README](../../README.md#auto-detected-exception-filter-error-body) for the
full rules.

```ts
import { detectErrorResponseShape } from '@nestbridge/core';

const errorResponseShape = detectErrorResponseShape('src/main.ts');
```

### `detectGlobalPrefix(bootstrapFilePath)`

Statically reads the app's `setGlobalPrefix(...)` call in the bootstrap file.
It returns a `BootstrapDetection<GlobalPrefix>`: `{ value, diagnostics }`, where
`value` is `{ prefix, exclude }` — `exclude` lists the routes the prefix skips
(string paths, and `{ path, method: RequestMethod.X }` entries as
`{ path, httpMethod }`) — or `undefined` when the file never sets a prefix. A
call that is conditional or made more than once, a prefix that is not a string
literal, or an exclusion it cannot read yields an `unsupported-global-prefix`
diagnostic and no value.

```ts
import { detectGlobalPrefix } from '@nestbridge/core';

const { value: globalPrefix, diagnostics } = detectGlobalPrefix('src/main.ts');
```

### `detectVersioning(bootstrapFilePath)`

Statically reads the app's `enableVersioning(...)` call. It returns a
`BootstrapDetection<UriVersioning>` whose `value` is
`{ prefix, defaultVersion? }`: the version prefix (`'v'` unless the call sets
another string, or `false` for none, read as `''`) and the default version of
routes that state none. Only `VersioningType.URI` is URL-expressible; header
and media-type versioning, a conditional or repeated call, and non-literal
values yield an `unsupported-versioning` diagnostic and no value.

```ts
import { detectVersioning } from '@nestbridge/core';

const { value: versioning, diagnostics } = detectVersioning('src/main.ts');
```

### `applyApplicationRouting(controllers, routing)`

Composes the application-level routing onto analyzed controllers, the way Nest
composes a route: `[global prefix][/<version prefix><version>][controller
path][method path]`. It returns new `ControllerDefinition`s whose methods'
`path` is the full request path; a prefix-excluded route skips the prefix but
keeps its version, and a `null` (`VERSION_NEUTRAL`) version adds no segment.
`routing` is an `ApplicationRouting` — `{ globalPrefix?, versioning? }`, the
two `value`s detected above, or any values you supply yourself.

```ts
import { analyzeControllers, applyApplicationRouting } from '@nestbridge/core';

const { controllers } = analyzeControllers(files);
const routed = applyApplicationRouting(controllers, {
  globalPrefix: { prefix: 'api', exclude: [{ path: 'health' }] },
  versioning: { prefix: 'v', defaultVersion: '1' },
});
```

### `generateErrorBodyDeclaration(errorBodyTypeSource)`

Turns the `errorBodyTypeSource` from `detectErrorResponseShape` into the text
of the fixed `nestbridge-error-body.d.ts` declaration file, exporting a
`NestBridgeErrorBody` type.

```ts
import { generateErrorBodyDeclaration } from '@nestbridge/core';

const source = generateErrorBodyDeclaration(errorResponseShape.errorBodyTypeSource);
```

### Diagnostics

```ts
import { formatDiagnostic, NestBridgeDiagnosticError } from '@nestbridge/core';
```

`formatDiagnostic` renders a `NestBridgeDiagnostic` as a human-readable
string (file, position, message). `NestBridgeDiagnosticError` wraps one or
more diagnostics as a thrown `Error`.

A diagnostic's `code` is one of `unsupported-route` (a non-literal route path or
version), `unsupported-parameter`, `unsupported-argument`,
`unsupported-return-type`, `circular-type`, `unsupported-global-prefix` and
`unsupported-versioning`.

### Types

`ControllerAnalysisResult`, `ControllerDefinition`,
`ControllerMethodDefinition`, `ControllerParameterDefinition`, `HttpMethod`,
`ParameterSourceKind`, `ResolverAnalysisResult`, `ResolverDefinition`,
`ResolverMethodDefinition`, `ResolverArgumentDefinition`, `SelectionField`,
`GraphqlOperationKind`, `ResponseKind`, `NestBridgeDiagnostic`,
`NestBridgeDiagnosticCode`, `ResponseWrapperDetection`,
`ErrorResponseShapeDetection`, `BootstrapDetection`, `GlobalPrefix`,
`GlobalPrefixExclusion`, `UriVersioning`, `ApplicationRouting`.

## License

MIT
