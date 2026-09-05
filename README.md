# NestBridge

NestBridge is a typed client bridge for NestJS controllers.

It lets frontend code import a NestJS controller directly, keep full TypeScript
autocomplete and type checking against the controller's real method
signatures, and get `fetch()` calls at runtime instead of the actual
controller implementation. NestJS, your services, your database code, and the
controller's own implementation never reach the browser.

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

1. **`@nestbridge/core`** statically analyzes controller source files using
   the TypeScript Compiler API — no NestJS runtime, no reflection, no
   executing your code. It extracts each controller's path, its HTTP methods,
   and each method's `@Param`/`@Query`/`@Body`/`@Headers` parameter mapping
   into a plain `ControllerDefinition` model. Argument types and return types
   are never re-derived from the AST — the generated declaration projects
   them straight from the real controller's own TypeScript type via a
   type-only reference, so it always matches what `tsc` already knows.
2. **`@nestbridge/vite`** is a Vite plugin. It globs your controller files,
   runs them through `@nestbridge/core`, and does two independent things with
   the result:
   - it writes the generated declarations to disk so TypeScript (your editor,
     `tsc`) sees a client-facing shape instead of the real controller when you
     import it through the configured alias;
   - it intercepts the *bundler's* resolution of that same import and serves
     a generated Vite virtual module that calls `@nestbridge/runtime`
     instead of the real file. The real controller source is never read by
     the bundler and never enters the browser's module graph.
3. **`@nestbridge/runtime`** is a tiny, zero-dependency `fetch()` wrapper that
   the generated virtual modules call into. It has no knowledge of NestJS at
   all.

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

The [`examples/basic`](examples/basic) app includes an automated test
(`examples/basic/client/tests/bundle-verification.test.ts`) that builds the
client and asserts the production bundle contains none of `@nestjs/common`,
`@nestjs/core`, `@nestjs/platform-express`, `reflect-metadata`, or the real
service implementation.

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
      baseURL: '/api',
    }),
  ],
});
```

The `resolve.alias` entry is what lets the bundler find the real controller
files (so the plugin can intercept them). A matching `paths` entry in
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
client at `examples/basic/client`, `users.controller.ts` ends up at
`.nestbridge/server/src/users/users.controller.d.ts` — hence the `paths`
entry above. Add `.nestbridge/` to your `.gitignore`; it's generated on every
build and on every dev-server start.

### `NestBridgeOptions`

```ts
interface NestBridgeOptions {
  controllers: string | string[]; // glob(s), resolved relative to the Vite root
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
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  fetch?: typeof globalThis.fetch;
}
```

Non-2xx responses reject with a `NestBridgeError`:

```ts
class NestBridgeError<T = unknown> extends Error {
  readonly status: number;
  readonly body: T;
  readonly response: Response;
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

## The frontend

```ts
import { UsersController } from '@server/users/users.controller';

const users = new UsersController();

const user = await users.findOne('123');
console.log(user.name);
```

`users.findOne` requires a `string`, and `user` is typed as `UserDto` —
exactly as declared in the controller — even though at runtime `users` is a
plain object that calls `fetch()`.

See [`examples/basic`](examples/basic) for a complete, runnable version of
this (NestJS server + Vite client), including a
[typecheck fixture](examples/basic/client/typecheck-fixtures/api-contract.ts)
that proves both the valid call above and two invalid calls
(`users.findOne(123)`, `new UsersController(anything)`) resolve exactly as
the architecture promises.

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

Route paths and decorator arguments must be static string literals
(`@Get(':id')`, not `@Get(createRoute())`) — NestBridge only analyzes source
text, it never executes your code.

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

```ts
// generated
findOne(...args: Parameters<ServerUsersController['findOne']>): RemoteResult<ServerUsersController['findOne']>;
```

Declaring it as a method (rather than a property typed as a function) keeps
IDE hovers and quick-documentation showing a normal method signature instead
of a function-typed property.

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
type (`ServerUsersController['findOne']`), not from NestBridge's own
analysis. The type-only import (`import type { UsersController as
ServerUsersController } from '...'`) is erased at compile time — the real
controller implementation, its NestJS decorators, and its dependencies never
reach the client bundle.

## Unsupported (by design, for this MVP)

- `@Req()` / `@Res()`, Express/Fastify request or response objects
- `StreamableFile`, Server-Sent Events, WebSockets
- `Observable<T>` return types
- custom parameter decorators
- runtime-computed controller or route paths

Each of these produces a diagnostic rather than a silent miscompile. `debug:
true` in `NestBridgeOptions` additionally logs controller discovery,
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
    core/      @nestbridge/core     — static analysis + declaration generation
    runtime/   @nestbridge/runtime  — browser fetch() client, zero dependencies
    vite/      @nestbridge/vite     — Vite plugin: discovery, virtual modules, HMR
  examples/
    basic/
      server/  a minimal NestJS app
      client/  a minimal Vite app importing the server's controller directly
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
  `.d.ts` output) via the shared [`tools/build/create-library-vite-config.ts`](tools/build/create-library-vite-config.ts)
  helper. The example NestJS server uses Vite's SSR build mode
  (`build.ssr: 'src/main.ts'`) instead of Nest CLI/webpack — still Vite, just
  targeting Node instead of the browser.
- **Biome** for formatting and linting, one root config
  ([`biome.json`](biome.json)).
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
yarn nx build core         # or runtime / vite / basic-server / basic-client
yarn nx test core
yarn nx typecheck core
yarn nx lint core

yarn build                 # nx run-many -t build
yarn test                  # nx run-many -t test
yarn typecheck             # nx run-many -t typecheck
yarn lint                  # nx run-many -t lint

yarn nx run basic-server:start   # run the example NestJS server
yarn nx run basic-client:dev     # run the example Vite dev server
```

## Limitations

This is an intentionally small MVP:

- One HTTP adapter (REST via `fetch`). The internal structure separates
  `@nestbridge/runtime`'s `http-adapter/` from its `config/` specifically so
  an alternative adapter (e.g. GraphQL) could be added later without
  reshaping the public `request()` contract.
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
