# nestbridge

[![Release](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/release.yml)
[![CI](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/MDReal32/nestbridge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/nestbridge.svg)](https://www.npmjs.com/package/nestbridge)

NestBridge is a typed client bridge for NestJS controllers and GraphQL
resolvers.

It lets frontend code import a NestJS controller or resolver directly, keep
full TypeScript autocomplete and type checking against its real method
signatures, and get a `fetch()`-based REST call or GraphQL request at runtime
instead of the actual implementation. NestJS, your services, your database
code, and the controller's or resolver's own implementation never reach the
browser.

```ts
import { UsersController } from '@server/users/users.controller';

const users = new UsersController();

const user = await users.findOne('123');
```

That import resolves to a real NestJS controller file. The bundler plugin
(Vite or webpack) intercepts it and replaces it with a generated
`fetch`-based implementation before it ever reaches the browser. TypeScript still sees a declaration generated from the
controller's real signatures, so autocomplete, parameter types, and return
types all work as if you were calling the controller directly.

This `nestbridge` package is a single-package convenience entry point: it
re-exports `@nestbridge/runtime`'s API and `@nestbridge/vite`'s and
`@nestbridge/webpack`'s plugins so you can depend on one package instead of
wiring up the pieces separately. It is also what the plugin's generated code
imports, so it must be a direct dependency of the app that uses the plugin.

```ts
// vite.config.ts
import nestBridge from 'nestbridge/vite';

export default defineConfig({
  plugins: [
    nestBridge({
      controllers: '../server/src/**/*.controller.ts',
      baseURL: '/api',
    }),
  ],
});
```

```ts
// app entry point — only needed for headers, a custom fetch or a GraphQL endpoint
import { configureNestBridge } from 'nestbridge';

configureNestBridge({
  headers: () => ({ authorization: `Bearer ${getToken()}` }),
});
```

- `nestbridge` re-exports all of `@nestbridge/runtime`'s public API:
  `configureNestBridge`, `setNestBridgeBaseURL`, `request`, `graphqlRequest`,
  `isNestBridgeError`, `NestBridgeError`, `NestBridgeGraphqlError`, `VERSION`,
  and the `NestBridgeConfig` / `NestBridgeRequest` / `NestBridgeGraphqlRequest`
  / `RemoteMethod` / `RemoteResult` / `RemoteObservableResult` /
  `RemoteStreamResult` types.
- `nestbridge/vite` re-exports `@nestbridge/vite`'s `nestBridge` plugin as its
  default export, plus the `NestBridgeOptions` type.
- `nestbridge/webpack` re-exports `@nestbridge/webpack`'s `nestBridge` plugin
  as its default export, plus the `NestBridgeOptions` type.

If you need the lower-level static-analysis or bundler-agnostic packages
directly, install `@nestbridge/core` or `@nestbridge/unplugin` on their
own — neither is re-exported here since they're implementation details of
`@nestbridge/vite`/`@nestbridge/webpack`, not part of the public
runtime/plugin surface.

## Contents

- [Why NestBridge exists](#why-nestbridge-exists)
- [How it works](#how-it-works)
- [Why NestJS never reaches the browser](#why-nestjs-never-reaches-the-browser)
- [Installation](#installation)
- [Setting up Vite](#setting-up-vite)
- [Setting up the runtime](#setting-up-the-runtime)
- [A NestJS controller, unmodified](#a-nestjs-controller-unmodified)
- [A GraphQL resolver, unmodified](#a-graphql-resolver-unmodified)
- [The frontend](#the-frontend)
- [Supported decorators](#supported-decorators)
- [Types are projected, not regenerated](#types-are-projected-not-regenerated)
- [Observables and streamed files](#observables-and-streamed-files)
- [Auto-detected global response wrapper](#auto-detected-global-response-wrapper)
- [Auto-detected exception filter error body](#auto-detected-exception-filter-error-body)
- [Unsupported (by design, for this MVP)](#unsupported-by-design-for-this-mvp)
- [DTOs](#dtos)
- [Development mode](#development-mode)
- [Architecture](#architecture)
- [Commands](#commands)
- [Limitations](#limitations)

## Why NestBridge exists

Sharing types between a NestJS backend and its frontend usually means
maintaining a parallel SDK, a GraphQL schema, or a tRPC router — a second
source of truth that has to be kept in sync with the controllers by hand.
NestBridge removes that second source of truth: the controller *is* the
contract. You write a normal NestJS controller; the frontend imports it
directly; NestBridge's bundler plugin does the translation from "TypeScript
method call" to "HTTP request" at build/dev time.

## How it works

```text
NestJS Controller
       │
       ▼
TypeScript AST
       │
       ▼
@nestbridge/core
       │
       ├──────────────┐
       │              │
       ▼              ▼
route metadata   client declarations
       │              │
       ▼              ▼
@nestbridge/unplugin   TypeScript IDE
(Vite / webpack)
       │
       ▼
generated client module
       │
       ▼
@nestbridge/runtime
       │
       ▼
fetch()
       │
       ▼
NestJS HTTP endpoint
```

1. **`@nestbridge/core`** statically analyzes controller and resolver source
   files using the TypeScript Compiler API — no NestJS runtime, no
   reflection, no executing your code. For controllers, it extracts each
   one's path, its HTTP methods, and each method's
   `@Param`/`@Query`/`@Body`/`@Headers` parameter mapping into a plain
   `ControllerDefinition`. For resolvers, it extracts each `@Query`/`@Mutation`
   method's operation kind and name, its `@Args()` parameters, and a
   selection set built from the return type's `@ObjectType()` fields, into a
   plain `ResolverDefinition`. Argument types and return types are never
   re-derived from the AST for code generation purposes — the generated
   declaration projects them straight from the real controller's or
   resolver's own TypeScript type via a type-only reference, so it always
   matches what `tsc` already knows.
2. **`@nestbridge/unplugin`** is the bundler plugin; `@nestbridge/vite` and
   `@nestbridge/webpack` are its Vite and webpack bindings. It globs your
   controller and resolver files, runs them through `@nestbridge/core`, and
   does two independent things with the result:
   - it writes the generated declarations to disk so TypeScript (your editor,
     `tsc`) sees a client-facing shape instead of the real controller or
     resolver when you import it through the configured alias;
   - in the bundler's `transform` hook (the plugin runs with
     `enforce: 'pre'`), it replaces the controller's or resolver's source
     with generated code that calls `@nestbridge/runtime`. The real file's own
     imports are never parsed, so none of them enter the browser's module
     graph.
3. **`@nestbridge/runtime`** is the client the generated modules call into: a
   `fetch()` wrapper for controllers, and a `fetch()`-based GraphQL request
   for resolvers. It has no knowledge of NestJS at all. Generated code imports
   it through the `nestbridge` package, which re-exports it.

Because the bundler-side interception and the TypeScript-side declaration are
two independent mechanisms, the browser genuinely never sees your controller,
your services, your database code, or `@nestjs/*` — while your editor still
shows you the real method signatures.

## Why NestJS never reaches the browser

- The bundler resolves the import through your alias as usual. The plugin's
  `transform` hook then checks whether the resolved file is a discovered
  controller or resolver and, if it is, swaps its source for the generated
  module. The real file's own imports (`@nestjs/common`, services, database
  clients) are therefore never parsed by the bundler.
- TypeScript's view of the same import is redirected independently, via a
  path alias pointing at a generated declaration file that only contains the
  HTTP-decorated methods, a zero-argument constructor, and the type-only
  imports those methods actually need.
- `@nestbridge/core` never depends on Vite, and `@nestbridge/runtime` never
  depends on NestJS — see [Architectural constraints](#architectural-constraints).

Each app under [`examples/`](../../examples) (`error-handling`, `graphql`, `http`,
`observable`, `streamable-file`) includes an automated test
(`client/tests/bundle-verification.test.ts`)
that builds the client and asserts the production bundle contains none of
`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `reflect-metadata`,
or the real service implementation.

## Installation

This is a Yarn (Berry) + Nx monorepo. From the repo root:

```bash
yarn install
```

In your own project, install the `nestbridge` package:

```bash
yarn add nestbridge
```

It bundles the runtime client (`nestbridge`), the Vite plugin (`nestbridge/vite`)
and the webpack plugin (`nestbridge/webpack`) behind one dependency. It has to
be a direct dependency of the app: the generated client modules and
declarations import from `'nestbridge'`. The Vite and webpack bindings declare
`vite` and `webpack` as peer dependencies, so you need the one you use.

The pieces are also published separately: `@nestbridge/runtime`,
`@nestbridge/vite` and `@nestbridge/webpack` (both thin bindings around
[`@nestbridge/unplugin`](../unplugin), the bundler-agnostic engine that
does the actual discovery, code generation, and declaration writing).
`@nestbridge/unplugin` itself depends on `@nestbridge/core` for static
analysis. Neither `@nestbridge/unplugin` nor `@nestbridge/core` is usually
installed directly.

## Setting up Vite

```ts
// vite.config.ts
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import nestBridge from 'nestbridge/vite';

export default defineConfig({
  resolve: {
    alias: {
      '@server': resolve(__dirname, '../server/src'),
    },
  },
  plugins: [
    nestBridge({
      controllers: '../server/src/**/*.controller.ts',
      resolvers: '../server/src/**/*.resolver.ts',
      baseURL: '/api',
    }),
  ],
});
```

`@nestbridge/vite` exports the same plugin as a named `nestBridge` export if
you install it directly. `resolvers` is optional — omit it if your app has no GraphQL resolvers. The
`resolve.alias` entry is what lets the bundler find the real controller and
resolver files (so the plugin can intercept them). A matching `paths` entry in
`tsconfig.json` is what lets TypeScript find the *generated* declarations
instead:

```json
{
  "compilerOptions": {
    "paths": {
      "@server/*": ["./.nestbridge/server/src/*"]
    }
  }
}
```

`paths` entries resolve relative to the `tsconfig.json` that declares them, so
no `baseUrl` is needed (TypeScript 7 removed that option).

NestBridge mirrors each controller's path under `outputDir`, relative to
`root`, stripping any leading `../` segments. For a controller glob of
`../server/src/**/*.controller.ts` resolved from a client at
`examples/http/client`, `items.controller.ts` ends up at
`.nestbridge/server/src/items/items.controller.d.ts` — hence the `paths`
entry above. Add `.nestbridge/` to your `.gitignore`; it's generated on every
build and on every dev-server start.

### `NestBridgeOptions`

```ts
interface NestBridgeOptions {
  controllers: string | string[]; // glob(s), resolved relative to `root`
  resolvers?: string | string[];   // glob(s) for GraphQL resolvers; defaults to none
  baseURL?: string;                // prefix for REST requests and the default GraphQL endpoint; applied to the runtime automatically
  debug?: boolean;                 // logs discovery/analysis/watch activity
  outputDir?: string;               // defaults to ".nestbridge", resolved from the bundler's own root (Vite's root / webpack's context) — independent of `root`
  root?: string;                    // base directory for discovering controllers/resolvers and the bootstrap file; defaults to Vite's root, or process.cwd() under webpack
}
```

`baseURL` needs no extra runtime code: when it is set, the plugin generates a
small module that calls `setNestBridgeBaseURL(baseURL)` from `nestbridge`, and
every generated controller and resolver module imports it. Leave it out and
requests go to the bare route path.

Using webpack instead of Vite? See [`@nestbridge/webpack`'s README](../webpack/README.md)
for the equivalent setup — same options, same generated output, different
bundler.

## Setting up the runtime

The generated client calls `request()` (controllers) and `graphqlRequest()`
(resolvers) from `nestbridge`. The base URL comes from the plugin's `baseURL`
option; everything else is configured with `configureNestBridge()`. Call it
once, before your first request — typically at the top of your app's entry
point:

```ts
import { configureNestBridge } from 'nestbridge';

configureNestBridge({
  async headers() {
    return { authorization: `Bearer ${getToken()}` };
  },
});
```

`configureNestBridge` replaces the whole config, so call it once with
everything you need rather than multiple times with partial options.

```ts
interface NestBridgeConfig {
  graphqlEndpoint?: string; // defaults to `${baseURL}/graphql`
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  fetch?: typeof globalThis.fetch;
}
```

The base URL lives separately so `configureNestBridge` can never overwrite it.
The plugin sets it for you; to set or clear it yourself, call
`setNestBridgeBaseURL('/api')` (or `setNestBridgeBaseURL(undefined)`). When
`graphqlEndpoint` is relative and the code runs in a browser, it is resolved
against `location.origin`.

REST requests behave as follows: query objects are serialized with
`URLSearchParams` (`undefined` and `null` values are skipped, arrays repeat the
key), a body is sent as JSON with `content-type: application/json`, per-request
headers from `@Headers` are merged over the global ones, and a `204`/`205`
response or an empty body resolves to `undefined`. A JSON response is parsed;
any other content type is returned as text.

Non-2xx REST responses reject with a `NestBridgeError`. Its message includes
the backend's error message when the response body has one:

```ts
class NestBridgeError<T = unknown> extends Error {
  readonly status: number;
  readonly body: T;
  readonly response: Response;
}
```

Generated resolver methods call `graphqlRequest()` instead, which POSTs
`{ query, variables }` with `fetch` to `graphqlEndpoint`. It rejects with a
`NestBridgeGraphqlError` when the HTTP status is not 2xx or the response carries
GraphQL `errors`:

```ts
class NestBridgeGraphqlError extends Error {
  readonly status: number;
  readonly errors: Array<{ message: string }> | undefined;
  readonly data: unknown;
}
```

`nestbridge` re-exports everything `@nestbridge/runtime` exports:

- values: `configureNestBridge`, `setNestBridgeBaseURL`, `request`,
  `graphqlRequest`, `isNestBridgeError`, `NestBridgeError`,
  `NestBridgeGraphqlError`, `VERSION`
- types: `NestBridgeConfig`, `NestBridgeRequest`, `NestBridgeGraphqlRequest`,
  `RemoteMethod`, `RemoteResult`, `RemoteObservableResult`,
  `RemoteStreamResult`

## A NestJS controller, unmodified

```ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('details') details?: boolean,
  ): Promise<UserDto> {
    return this.usersService.findOne(id, details);
  }

  @Post()
  create(@Body() body: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(body);
  }
}
```

Nothing about this controller is NestBridge-specific — no base class, no
decorator, no special syntax. It's a normal NestJS controller.

## A GraphQL resolver, unmodified

```ts
@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserType)
  findOne(@Args('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => UserType, { name: 'createUser' })
  create(@Args('name') name: string) {
    return this.usersService.create({ name });
  }
}
```

Nothing about this resolver is NestBridge-specific either. Notice that
neither method has a TypeScript return-type annotation — NestBridge builds
the client's selection set from the `@Query()`/`@Mutation()` type thunk
(`() => UserType`) directly, exactly as `@nestjs/graphql` itself already
requires that thunk at runtime to build the schema. There's no redundant
second annotation to keep in sync, matching the DX of REST controllers above.

## The frontend

```ts
import { UsersController } from '@server/users/users.controller';
import { UsersResolver } from '@server/users/users.resolver';

const users = new UsersController();
const usersResolver = new UsersResolver();

const user = await users.findOne('123');
console.log(user.name);

const queried = await usersResolver.findOne('123');
console.log(queried.name);
```

`users.findOne` requires a `string`, and `user` is typed as `UserDto` —
exactly as declared in the controller — even though at runtime `users` is a
plain object that calls `fetch()`. `usersResolver.findOne` works the same
way, except at runtime it sends a GraphQL request instead.

See [`examples/http`](../../examples/http) for a complete, runnable version of the
REST side (NestJS server + Vite client), and [`examples/graphql`](../../examples/graphql)
for the resolver side. Each includes a
[typecheck fixture](../../examples/http/client/typecheck-fixtures/api-contract.ts)
that proves both a valid call and invalid calls (a wrong-typed argument, an
unexpected constructor argument) resolve exactly as the architecture promises.

## Supported decorators

| Decorator | Server meaning | Client behavior |
| --- | --- | --- |
| `@Controller(path?)` | Base path | Prefixed onto every method path |
| `@Get` / `@Post` / `@Put` / `@Patch` / `@Delete` | HTTP method + path | `request({ method, path })` |
| `@Param('name')` | Route parameter | Interpolated into the path, `encodeURIComponent`-escaped |
| `@Query('name')` | Named query parameter | Merged into the `query` object |
| `@Query()` | Whole query object | Passed through as `query` |
| `@Body('name')` | Named body field | Merged into the `body` object |
| `@Body()` | Whole body | Passed through as `body` |
| `@Headers('name')` | Named header | Merged into the `headers` object |

GraphQL resolvers:

| Decorator | Server meaning | Client behavior |
| --- | --- | --- |
| `@Resolver(() => Type)` | Base object type | Used to resolve nested `@ObjectType()` fields |
| `@Query(name?)` / `@Query(() => Type)` | Query operation, name, return type | `graphqlRequest({ document, variables })` with a `query` document |
| `@Mutation(() => Type, { name? })` | Mutation operation, name, return type | Same, with a `mutation` document |
| `@Args('name')` | Named GraphQL variable | Declared as `$name: <GraphQLType>` and passed as a request variable |

Route paths, operation names, and decorator arguments must all be static
string literals (`@Get(':id')`, not `@Get(createRoute())`) — NestBridge only
analyzes source text, it never executes your code.

## Types are projected, not regenerated

NestBridge never prints or reconstructs a method's argument or return type.
The generated declaration carries a type-only import of the real controller
class and projects each exposed method as a plain method signature, built
from TypeScript's own `Parameters<T>` plus a `RemoteResult<T>` helper:

```ts
type RemoteResult<T> = T extends (...args: never[]) => infer Result
  ? Promise<Awaited<Result>>
  : never;
```

which is exactly what a generated declaration looks like on disk:

```ts
// .nestbridge/server/src/users/users.controller.d.ts
import type { UsersController as __ServerUsersController } from '../../server/src/users/users.controller';
import type { RemoteResult } from 'nestbridge';

export declare class UsersController {
  constructor();

  findOne(...args: Parameters<__ServerUsersController['findOne']>): RemoteResult<__ServerUsersController['findOne']>;
  create(...args: Parameters<__ServerUsersController['create']>): RemoteResult<__ServerUsersController['create']>;
}
```

Declaring each member as a method (rather than a property typed as a
function) keeps IDE hovers and quick-documentation showing a normal method
signature instead of a function-typed property. `nestbridge` (re-exporting
`@nestbridge/runtime`) also exports `RemoteMethod<T>` — `Parameters<T>` and `RemoteResult<T>` combined
into a single callable type — for cases outside code generation where you
want the whole thing as one type (writing a manual SDK wrapper, a mock, a
test double).

Because this is a real TypeScript type operation — not a reprint — it works
whether or not the method has an explicit return type annotation:

```ts
// both are fully supported, with identical client-side types
findOne(@Param('id') id: string): Promise<UserDto> { ... }
findOne(@Param('id') id: string) { return this.usersService.findOne(id); }
```

Inferred return types — including nested object-literal shapes and literal
types (`{ theme: 'dark' as const }`) — carry through exactly as TypeScript
infers them, since the client type comes from indexing the real controller's
type (`__ServerUsersController['findOne']`), not from NestBridge's own
analysis. The type-only import (`import type { UsersController as
__ServerUsersController } from '...'`) is erased at compile time — the real
controller implementation, its NestJS decorators, and its dependencies never
reach the client bundle.

Resolvers get the exact same declaration, generated from the exact same
`ResolverDefinition['name'] → sourceFile → methods` shape — so a resolver
method's TypeScript type also never needs an explicit return-type annotation.
What's different for resolvers is the *analysis* NestBridge runs to decide
what to fetch: it reads the `@Query()`/`@Mutation()` type-thunk argument to
resolve the return type, then walks that type's `@ObjectType()` fields to
build the GraphQL selection set baked into the generated request document —
falling back to a TS return-type annotation only for the legacy
`@Query('name')` string-only form.

## Observables and streamed files

NestBridge classifies each controller method by its declared return type,
after unwrapping `Promise<...>`, and picks the matching helper type for the
generated declaration:

| Declared return type | Helper | Client resolves with |
| --- | --- | --- |
| `Observable<T>` / `Promise<Observable<T>>` | `RemoteObservableResult` | `Promise<T>` — the response body, not an `Observable` |
| `StreamableFile` | `RemoteStreamResult` | `Promise<Blob>`; the request is sent with `responseType: 'blob'` |
| anything else | `RemoteResult` | the awaited return type |

Classification reads the method's *explicit* return type annotation, matched by
name, so annotate `Observable<T>` or `StreamableFile` on the method. Without an
annotation the method is treated as a plain JSON response. An `Observable` is
treated as a single JSON body — streams of server-sent events are not
supported.

## Auto-detected global response wrapper

Both auto-detected features below read your app's bootstrap file: NestBridge
looks for exactly one `main.ts` under `root` (ignoring `node_modules` and
`outputDir`). With none, or more than one, nothing is detected.

If your app registers a global interceptor —

```ts
// main.ts
app.useGlobalInterceptors(new ResponseInterceptor());
```

— whose `intercept()` method reshapes every response through exactly

```ts
return next.handle().pipe(map((value) => ({ data: value, meta: { requestId: '...' } })));
```

NestBridge statically detects this shape from the bootstrap file and reflects
it in the generated client types automatically. No option, import, or config
is involved — the client's JSON-returning methods resolve to the wrapped
shape (with the interceptor's payload parameter substituted by
`Awaited<Result>`) instead of the unwrapped `RemoteResult<T>`:

```ts
findOne(...args: Parameters<__ServerUsersController['findOne']>): __NestBridgeWrapped<__ServerUsersController['findOne']>;
```

Multiple global interceptors — registered across separate
`useGlobalInterceptors()` calls or as multiple arguments to one call — are
composed in registration order, matching how Nest chains them at runtime:
the first-registered interceptor wraps the ones registered after it, so its
shape becomes the outermost type, and the last-registered interceptor's
shape wraps the raw handler result directly.

`Observable<T>` and streamed responses are never wrapped — the interceptor
reshaping only applies to standard JSON bodies.

This is a "never guess" analysis: it only recognizes exactly the shape above,
for every registered interceptor. Anything else — an interceptor class that
isn't a bare `new X()` argument, a `.pipe()` chain with more than one
operator, an operator other than `map`, a `map` not imported from `'rxjs'`,
a callback with zero or more than one parameter, a non-object-literal return
value, or an object literal that references its payload parameter more than
once (or not at all) — is silently not detected, and the client falls back
to the regular unwrapped `RemoteResult<T>`. A single unrecognized interceptor
anywhere in the chain bails the whole detection, not just that interceptor's
own contribution. There is no diagnostic for this: it's an app-wide concern,
not a per-controller-method one, so a failed detection just means the types
stay unwrapped.

## Auto-detected exception filter error body

If your app registers a single global exception filter — either in `main.ts`

```ts
app.useGlobalFilters(new HttpExceptionFilter());
```

or as an `APP_FILTER` provider on the root module

```ts
@Module({
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
```

— decorated with `@Catch(...)`, whose `catch()` method reshapes the error
through exactly one `.json(...)`/`.send(...)` call with an object literal:

```ts
@Catch(HttpException)
class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    response.json({ statusCode: exception.getStatus(), message: exception.message });
  }
}
```

NestBridge statically detects the shape of that response body and writes it
to a fixed declaration file, `<outputDir>/nestbridge-error-body.d.ts`,
exporting a `NestBridgeErrorBody` type:

```ts
// .nestbridge/nestbridge-error-body.d.ts
export type NestBridgeErrorBody = { statusCode: number; message: string };
```

Unlike the response wrapper's payload passthrough, an exception filter builds
its response body from the exception at hand, so NestBridge widens a small
whitelist of members read off the exception parameter — resolved through any
number of simple local variable aliases (`const err = exception; const status
= err.getStatus();`):

- `<exception>.message` → `string`
- `<exception>.getStatus()`, called with no arguments → `number`

Nested object literals recurse, and string/number/boolean/null literals widen
to their primitive type, the same way the response wrapper feature handles
its payload's object literal.

`nestbridge` (re-exporting `@nestbridge/runtime`) exports a matching type
guard, so a caught error narrows against the generated type:

```ts
import { isNestBridgeError } from 'nestbridge';
import type { NestBridgeErrorBody } from '../../.nestbridge/nestbridge-error-body';

try {
  await users.findOne('123');
} catch (error) {
  if (isNestBridgeError<NestBridgeErrorBody>(error)) {
    console.log(error.body.statusCode, error.body.message);
  }
}
```

This is a "never guess" analysis, same as the response wrapper: it only
recognizes exactly the shape above. Anything else — `useGlobalFilters` and an
`APP_FILTER` provider registering different classes, a filter class not
decorated with `@Catch`, a filter argument that isn't a bare `new X()`, an
`APP_FILTER` entry using `useValue`/`useFactory` instead of `useClass`, a
spread element in the `providers` array, more than one distinct class
registered via `APP_FILTER`, a `catch()` method that doesn't call
`.json`/`.send` exactly once, a `catch()` method that branches, a response
body that isn't an object literal, or a property value that isn't one of the
widened shapes above — is silently not detected. There is no diagnostic for
this: it's an app-wide concern, not a per-controller-method one, so a failed
detection just means `nestbridge-error-body.d.ts` is never written (or is
removed, if the filter is removed) and `NestBridgeErrorBody` stays
unavailable — `isNestBridgeError(error)` still narrows the error type, just
without a type argument to narrow `error.body` further.

## Unsupported (by design, for this MVP)

REST controllers (each of these produces a diagnostic):

- `@Req()` / `@Res()` / `@Request()` / `@Response()`, Express/Fastify request
  or response objects
- parameters without `@Param`/`@Query`/`@Body`/`@Headers`, including custom
  parameter decorators and destructured parameters
- a bare `@Param()` or `@Headers()` — both need a name
- runtime-computed controller or route paths

Not supported, and not diagnosed: Server-Sent Events (`@Sse()`) and WebSockets.

GraphQL resolvers (each of these produces a diagnostic):

- destructured `@Args()` parameters, a bare `@Args()`, or `@Args()` parameters
  without an explicit TypeScript type annotation
- return types NestBridge cannot resolve to an `@ObjectType()` class, such as
  interface and union types
- runtime-computed operation names

Not supported, and not diagnosed: `@Subscription()` and `@ResolveField()` /
nested field resolvers. Only methods decorated with `@Query()` or `@Mutation()`
are exposed on the client.

Diagnostics print the file, line and column. In a one-shot build (`vite build`,
a webpack production build) they throw and fail the build; in watch mode
(`vite`, webpack `--watch`) they are logged as warnings so the dev server keeps
running. `debug: true` in `NestBridgeOptions` additionally logs
controller/resolver discovery, analysis, and watch activity.

## DTOs

NestBridge doesn't impose Zod, class-validator, Prisma, or any other schema
system — it preserves whatever TypeScript types your controller already
uses. It works well with a shared contracts package:

```text
client ────────┐
               │
               ▼
          contracts
               ▲
               │
server ────────┘
```

```ts
import { CreateUserDto, UserDto } from '@app/contracts/users';
```

Since the generated declaration projects types from a type-only reference to
the real controller class, any DTOs referenced by its parameters or return
type are picked up automatically through that same reference — NestBridge
never needs to resolve or re-emit their imports itself.

## Development mode

The plugin works the same way under `vite dev` and webpack's watch mode as
under a one-shot build. When a tracked controller, resolver, or bootstrap file
changes, the plugin's `watchChange` hook re-runs the analysis and rewrites the
generated declarations — no dev-server restart required. The changed module
itself is re-generated by the bundler's normal `transform` pass.

## Architecture

```text
nestbridge/
  packages/
    core/       @nestbridge/core     — static analysis (controllers + resolvers) + declaration generation
    runtime/    @nestbridge/runtime  — browser client: fetch() for REST and GraphQL
    unplugin/   @nestbridge/unplugin — bundler-agnostic plugin: discovery, code generation, declarations, watch
    vite/       @nestbridge/vite     — thin Vite binding around @nestbridge/unplugin
    webpack/    @nestbridge/webpack  — thin webpack binding around @nestbridge/unplugin
    nestbridge/ nestbridge           — single-package facade re-exporting runtime + vite + webpack
  examples/
    http/             REST controllers
    graphql/          GraphQL resolvers
    observable/       Observable<T> responses
    streamable-file/  StreamableFile responses
    error-handling/   response-wrapper and exception-filter detection
      server/  a minimal NestJS app
      client/  a minimal Vite app importing the server's controllers/resolvers directly
```

Dependency graph:

```text
@nestbridge/core

@nestbridge/runtime

@nestbridge/unplugin
    └── @nestbridge/core

@nestbridge/vite
    └── @nestbridge/unplugin

@nestbridge/webpack
    └── @nestbridge/unplugin

nestbridge
    ├── @nestbridge/runtime
    ├── @nestbridge/vite
    └── @nestbridge/webpack
```

### Architectural constraints

- `@nestbridge/core` never depends on Vite or webpack.
- `@nestbridge/runtime` never depends on NestJS.
- `@nestbridge/unplugin` never depends on Vite or webpack directly — bundler
  bindings come from the [`unplugin`](https://github.com/unjs/unplugin)
  library.
- `@nestbridge/vite` and `@nestbridge/webpack` are thin bindings around
  `@nestbridge/unplugin` and add no plugin logic of their own.
- No circular dependencies between packages.

### Toolchain

- **Yarn** (Berry, `node-modules` linker) for workspace/package management.
- **Nx** for orchestration, caching, and the dependency graph — the `build`,
  `test`, `typecheck` and `lint` targets are each project's own
  `package.json` scripts, which Nx runs and caches.
- **Changesets** for versioning and releases. The six published packages are a
  `fixed` group and always share one version.
- **Vite** is the single build system, for every package and every example
  application. Library packages use Vite library mode (`ssr: true` for
  automatic dependency externalization, `@nestbridge/*` packages explicitly
  kept external so they are never bundled into each other,
  `rolldown-plugin-dts` for rolled-up `.d.ts` output) via the shared [`tools/build/create-library-vite-config.ts`](../../tools/build/create-library-vite-config.ts)
  helper. The example NestJS server uses Vite's SSR build mode
  (`build.ssr: 'src/main.ts'`) instead of Nest CLI/webpack — still Vite, just
  targeting Node instead of the browser.
- **Biome** for formatting and linting, one root config
  ([`biome.json`](../../biome.json)).
- **Vitest** for tests.

Package build output is named `nestbridge.<package>.js` (e.g.
`nestbridge.core.js`), built from `src/main.ts`. The `nestbridge` facade is the
exception: it builds `index.js`, `vite.js` and `webpack.js` from
`src/index.ts`, `src/vite.ts` and `src/webpack.ts`, and `src/index.ts`
star-re-exports `@nestbridge/runtime` so editors see the real class, function,
interface and type kind of each symbol rather than a generic alias.

### Why esbuild + `@Inject()` in the example server

Vite's default transform (esbuild) supports TypeScript's legacy
`experimentalDecorators`, which is how `@Controller`/`@Get`/`@Param`/etc.
survive the build — but it does not implement `emitDecoratorMetadata`, which
NestJS's constructor injection normally relies on
(`Reflect.getMetadata('design:paramtypes', ...)`). The example works around
this the same way esbuild/SWC-based NestJS setups generally do: explicit
`@Inject(Token)` on constructor parameters, which doesn't need
`design:paramtypes` at all.

## Commands

```bash
yarn nx build core         # or runtime / unplugin / vite / webpack / nestbridge / http-client / ...
yarn nx test core
yarn nx typecheck core
yarn nx lint core

yarn build                 # nx build nestbridge (and everything it depends on)
yarn nx run-many -t build  # every project, examples included
yarn nx run-many -t test
yarn nx run-many -t typecheck
yarn nx run-many -t lint

yarn format                # biome format --write .

yarn nx run http-server:dev     # run an example NestJS server
yarn nx run http-client:dev     # run its Vite dev server

yarn changeset             # record a release note for your change
yarn run version           # apply pending changesets (changeset version)
```

## Limitations

This is an intentionally small MVP:

- Two adapters, both plain `fetch`: REST (`@nestbridge/runtime`'s
  `http-adapter/`) and GraphQL (its sibling `graphql-adapter/`) — kept as
  separate modules behind `config/` so either can evolve independently of
  `request()`/`graphqlRequest()`'s public contract.
- No request/response interceptors beyond global + per-request headers and a
  custom `fetch` implementation.
- `NestBridgeOptions.baseURL` configures only the runtime's base URL (and the
  default GraphQL endpoint). Headers, `fetch` and an explicit
  `graphqlEndpoint` stay with `configureNestBridge`, which the plugin never
  touches — it keeps the base URL in separate state precisely so that
  `configureNestBridge`'s replace-the-whole-config behavior cannot overwrite
  it.
- Declarations are files on disk, regenerated on `buildStart` and on
  controller change — there's no separate "watch types only" mode.
