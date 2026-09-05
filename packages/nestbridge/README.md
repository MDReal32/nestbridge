# nestbridge

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

That import resolves to a real NestJS controller file. Vite intercepts it and
replaces it with a generated `fetch`-based implementation before it ever
reaches the browser. TypeScript still sees a declaration generated from the
controller's real signatures, so autocomplete, parameter types, and return
types all work as if you were calling the controller directly.

This `nestbridge` package is a single-package convenience entry point: it
re-exports `@nestbridge/runtime`'s API and `@nestbridge/vite`'s plugin so you
can depend on one package instead of wiring up the two separately.

```ts
import { configureNestBridge } from 'nestbridge';

configureNestBridge({ baseURL: '/api' });
```

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

- `nestbridge` re-exports `@nestbridge/runtime`'s public API: `configureNestBridge`,
  `request`, `NestBridgeError`, and the `NestBridgeConfig` / `NestBridgeRequest`
  / `RemoteMethod` / `RemoteResult` types.
- `nestbridge/vite` re-exports `@nestbridge/vite`'s `nestBridge` plugin as its
  default export, plus the `NestBridgeOptions` type.

If you need the lower-level static-analysis package directly, install
`@nestbridge/core` on its own — it isn't re-exported here since it's an
implementation detail of `@nestbridge/vite`, not part of the public
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
directly; NestBridge's Vite plugin does the translation from "TypeScript
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
@nestbridge/vite   TypeScript IDE
       │
       ▼
Vite virtual module
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
2. **`@nestbridge/vite`** is a Vite plugin. It globs your controller and
   resolver files, runs them through `@nestbridge/core`, and does two
   independent things with the result:
   - it writes the generated declarations to disk so TypeScript (your editor,
     `tsc`) sees a client-facing shape instead of the real controller or
     resolver when you import it through the configured alias;
   - it intercepts the *bundler's* resolution of that same import and serves
     a generated Vite virtual module that calls `@nestbridge/runtime`
     instead of the real file. The real source is never read by the bundler
     and never enters the browser's module graph.
3. **`@nestbridge/runtime`** is the client the generated virtual modules call
   into: a `fetch()` wrapper for controllers, and a
   [`graphql-request`](https://github.com/jasonkuhrt/graphql-request)-based
   client for resolvers. It has no knowledge of NestJS at all.

Because the bundler-side interception and the TypeScript-side declaration are
two independent mechanisms, the browser genuinely never sees your controller,
your services, your database code, or `@nestjs/*` — while your editor still
shows you the real method signatures.

## Why NestJS never reaches the browser

- The Vite plugin's `resolveId` hook resolves the import the same way Vite
  would (respecting aliases), then checks whether the resolved file is a
  known controller. If it is, it substitutes a virtual module id instead of
  letting Vite read the real file. The real file's own imports (`@nestjs/common`,
  services, database clients) are therefore never parsed by the bundler.
- TypeScript's view of the same import is redirected independently, via a
  path alias pointing at a generated declaration file that only contains the
  HTTP-decorated methods, a zero-argument constructor, and the type-only
  imports those methods actually need.
- `@nestbridge/core` never depends on Vite, and `@nestbridge/runtime` never
  depends on NestJS — see [Architectural constraints](#architectural-constraints).

Each app under [`examples/`](../../examples) (`http`, `graphql`, `observable`,
`streamable-file`) includes an automated test (`client/tests/bundle-verification.test.ts`)
that builds the client and asserts the production bundle contains none of
`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `reflect-metadata`,
or the real service implementation.

## Installation

This is a Yarn (Berry) + Nx monorepo. From the repo root:

```bash
yarn install
```

In your own project, install the three packages:

```bash
yarn add -D @nestbridge/vite
yarn add @nestbridge/runtime
```

`@nestbridge/core` is a dependency of `@nestbridge/vite` and is not usually
installed directly.

## Setting up Vite

```ts
// vite.config.ts
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { nestBridge } from '@nestbridge/vite';

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

`resolvers` is optional — omit it if your app has no GraphQL resolvers. The
`resolve.alias` entry is what lets the bundler find the real controller and
resolver files (so the plugin can intercept them). A matching `paths` entry in
`tsconfig.json` is what lets TypeScript find the *generated* declarations
instead:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@server/*": ["./.nestbridge/server/src/*"]
    }
  }
}
```

NestBridge mirrors each controller's path under `<root>/.nestbridge/`,
relative to your Vite project root, stripping any leading `../` segments. For
a controller glob of `../server/src/**/*.controller.ts` resolved from a
client at `examples/http/client`, `items.controller.ts` ends up at
`.nestbridge/server/src/items/items.controller.d.ts` — hence the `paths`
entry above. Add `.nestbridge/` to your `.gitignore`; it's generated on every
build and on every dev-server start.

### `NestBridgeOptions`

```ts
interface NestBridgeOptions {
  controllers: string | string[]; // glob(s), resolved relative to the Vite root
  resolvers?: string | string[];   // glob(s) for GraphQL resolvers; defaults to none
  baseURL?: string;                // informational; call configureNestBridge for the runtime effect
  debug?: boolean;                 // logs discovery/analysis/HMR activity
  outputDir?: string;               // defaults to ".nestbridge"
}
```

## Setting up the runtime

The generated client calls `@nestbridge/runtime`'s `request()` function,
which reads its configuration from a single global set by
`configureNestBridge()`. Call it once, before your first request — typically
at the top of your app's entry point:

```ts
import { configureNestBridge } from '@nestbridge/runtime';

configureNestBridge({
  baseURL: '/api',
  async headers() {
    return { authorization: `Bearer ${getToken()}` };
  },
});
```

`configureNestBridge` replaces the whole config, so call it once with
everything you need rather than multiple times with partial options.

```ts
interface NestBridgeConfig {
  baseURL?: string;
  graphqlEndpoint?: string; // defaults to `${baseURL}/graphql`
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  fetch?: typeof globalThis.fetch;
}
```

Non-2xx REST responses reject with a `NestBridgeError`:

```ts
class NestBridgeError<T = unknown> extends Error {
  readonly status: number;
  readonly body: T;
  readonly response: Response;
}
```

Generated resolver methods call `graphqlRequest()` instead, which sends a
request through [`graphql-request`](https://github.com/jasonkuhrt/graphql-request)
to `graphqlEndpoint` and rejects failed requests with a `NestBridgeGraphqlError`:

```ts
class NestBridgeGraphqlError extends Error {
  readonly status: number;
  readonly errors: GraphQLError[] | undefined;
  readonly data: Record<string, unknown> | undefined;
  readonly request: unknown;
}
```

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

See [`examples/http`](../../examples/http) for a complete, runnable version of
the REST side (NestJS server + Vite client), and
[`examples/graphql`](../../examples/graphql) for the resolver side. Each
includes a
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
import type { RemoteResult } from '@nestbridge/runtime';

export declare class UsersController {
  constructor();

  findOne(...args: Parameters<__ServerUsersController['findOne']>): RemoteResult<__ServerUsersController['findOne']>;
  create(...args: Parameters<__ServerUsersController['create']>): RemoteResult<__ServerUsersController['create']>;
}
```

Declaring each member as a method (rather than a property typed as a
function) keeps IDE hovers and quick-documentation showing a normal method
signature instead of a function-typed property. `@nestbridge/runtime` also
exports `RemoteMethod<T>` — `Parameters<T>` and `RemoteResult<T>` combined
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

## Unsupported (by design, for this MVP)

REST controllers:

- `@Req()` / `@Res()`, Express/Fastify request or response objects
- `StreamableFile`, Server-Sent Events, WebSockets
- `Observable<T>` return types
- custom parameter decorators
- runtime-computed controller or route paths

GraphQL resolvers:

- `@Subscription()`
- `@ResolveField()` / nested field resolvers
- interface and union return types
- destructured `@Args()` parameters, or `@Args()` parameters without an
  explicit TypeScript type annotation
- runtime-computed operation names

Each of these produces a diagnostic rather than a silent miscompile. `debug:
true` in `NestBridgeOptions` additionally logs controller/resolver discovery,
analysis, and HMR activity.

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

The plugin works the same way under `vite dev` as under `vite build`. When a
controller file changes, `handleHotUpdate` re-analyzes it, rewrites its
declaration, and invalidates the corresponding virtual module so Vite's
normal HMR machinery picks up the change — no dev-server restart required.

## Architecture

```text
nestbridge/
  packages/
    core/      @nestbridge/core     — static analysis (controllers + resolvers) + declaration generation
    runtime/   @nestbridge/runtime  — browser client: fetch() for REST, graphql-request for GraphQL
    vite/      @nestbridge/vite     — Vite plugin: discovery, virtual modules, HMR
  examples/
    basic/
      server/  a minimal NestJS app, with both a REST controller and a GraphQL resolver
      client/  a minimal Vite app importing the server's controller and resolver directly
```

Dependency graph:

```text
@nestbridge/core

@nestbridge/runtime

@nestbridge/vite
    ├── @nestbridge/core
    └── @nestbridge/runtime
```

### Architectural constraints

- `@nestbridge/core` never depends on Vite.
- `@nestbridge/runtime` never depends on NestJS.
- `@nestbridge/vite` may depend on both.
- No circular dependencies between the three packages.

### Toolchain

- **Yarn** (Berry, `node-modules` linker) for workspace/package management.
- **Nx** for orchestration, caching, and the dependency graph — every target
  (`build`, `test`, `typecheck`, `lint`) is a thin `nx:run-commands` wrapper
  around the underlying tool.
- **Vite** is the single build system, for every package and every example
  application. Library packages use Vite library mode (`ssr: true` for
  automatic dependency externalization, `vite-plugin-dts` for rolled-up
  `.d.ts` output) via the shared [`tools/build/create-library-vite-config.ts`](../../tools/build/create-library-vite-config.ts)
  helper. The example NestJS server uses Vite's SSR build mode
  (`build.ssr: 'src/main.ts'`) instead of Nest CLI/webpack — still Vite, just
  targeting Node instead of the browser.
- **Biome** for formatting and linting, one root config
  ([`biome.json`](../../biome.json)).
- **Vitest** for tests.

Package build output is named `nestbridge.<package>.js` (e.g.
`nestbridge.core.js`), built from `src/main.ts`.

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
yarn nx build core         # or runtime / vite / http-server / http-client / ...
yarn nx test core
yarn nx typecheck core
yarn nx lint core

yarn build                 # nx run-many -t build
yarn test                  # nx run-many -t test
yarn typecheck             # nx run-many -t typecheck
yarn lint                  # nx run-many -t lint

yarn nx run http-server:start   # run an example NestJS server
yarn nx run http-client:dev     # run its Vite dev server
```

## Limitations

This is an intentionally small MVP:

- Two adapters: REST via `fetch` (`@nestbridge/runtime`'s `http-adapter/`)
  and GraphQL via `graphql-request` (`http-adapter/`'s sibling
  `graphql-adapter/`) — kept as separate modules behind `config/` so either
  can evolve independently of `request()`/`graphqlRequest()`'s public
  contract.
- No request/response interceptors beyond global + per-request headers and a
  custom `fetch` implementation.
- No automatic runtime wiring between `NestBridgeOptions.baseURL` (the Vite
  plugin option) and the runtime's `configureNestBridge` — call
  `configureNestBridge` yourself. Wiring them together automatically would
  mean the plugin silently overwriting any headers/fetch customization a
  consuming app configured itself, since `configureNestBridge` replaces its
  whole config rather than merging.
- Declarations are files on disk, regenerated on `buildStart` and on
  controller change — there's no separate "watch types only" mode.
