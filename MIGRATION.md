# Migrating from nestrelay

2.6 adds `@EventPattern` / `@MessagePattern` handlers as a third NestBridge transport, replacing the
`nestrelay` library. Nothing changes for existing NestBridge apps: the new `messagePatterns` option is off by
default. See [Microservice controllers](README.md#microservice-controllers) for the full reference.

## Plugin

Remove `nestRelayUnplugin` and add the provider as a NestBridge app with `messagePatterns: true`. There is no
workspace auto-discovery, so each provider gets an entry, and its `name` is the service name the runtime uses:

```ts
plugins: [
  nestBridge([
    { name: 'catalog', root: '../catalog', controllers: 'src/**/*.controller.ts' },
    { name: 'notifications', root: '../notifications', controllers: 'src/**/*.controller.ts', messagePatterns: true },
  ]),
],
resolve: {
  alias: {
    '@notifications': path.resolve(import.meta.dirname, '../notifications/src'),
  },
},
```

## Imports and `paths`

Import the provider's real controller through your alias instead of the virtual `@nestrelay/` specifier:

```diff
- import { EmailsController } from '@nestrelay/notifications/emails/emails.controller';
+ import { EmailsController } from '@notifications/emails/emails.controller';
```

Point the alias's tsconfig `paths` entry at the generated declarations under `.nestbridge/<name>/…`, like any other
NestBridge app, and remove the `@nestrelay/*` entry and the `.nestrelay/` folder.

## Runtime

| nestrelay | NestBridge |
| --- | --- |
| `configureNestRelay({ notifications: client })` | `configureNestBridgeMicroservices({ clients: { notifications: client } })` |
| RabbitMQ default from `RABBITMQ_URL` and `<service>_queue` | `defaultClient: (service) => options`, written by the caller |
| `closeNestRelay()` | `closeNestBridgeMicroservices()` |
| `relayEmit(service, pattern, payload)` | `emitMessage({ service, pattern, payload })` |
| `relaySend(service, pattern, payload)` | `sendMessage({ service, pattern, payload })` |

All of them come from `nestbridge/microservices`. There is no built-in broker default; to keep nestrelay's
behaviour, configure it once:

```ts
configureNestBridgeMicroservices({
  defaultClient: (service) => ({
    transport: Transport.RMQ,
    options: { urls: [env.RABBITMQ_URL], queue: `${service}_queue`, queueOptions: { durable: true } },
  }),
});
```

A service without a client now rejects with a `NestBridgeMicroserviceError` naming the service.

## What changed in behaviour

- Generated classes are plain classes, not `Injectable()`. Nest still instantiates them as providers, because
  they have no constructor dependencies.
- An unsupported pattern no longer throws for the whole build. It gives an `unsupported-message-pattern`
  diagnostic that drops that method; a one-shot build still fails on it, and watch mode logs it.
- The manifest (`manifest.json`, builds without the provider's source) is not supported. A caller needs the
  provider's source at build time, as with HTTP and GraphQL controllers.

# Migrating from 2.1 to 2.2

2.2 adds support for several server apps in one client, `@Controller({ path, version })` and `@Version`, and reads
the global prefix and URI versioning from the app's bootstrap file. Every `@nestbridge/*` package and `nestbridge`
move to 2.2.0 together.

A config that worked on 2.1 keeps its shape: `nestBridge({ ... })` still takes a single object, nothing was
removed, and no option was renamed. What can change is the **output** of a build, because NestBridge now reads two
more things from your bootstrap file. Check the three items under [What may need attention](#what-may-need-attention),
then adopt the new options you want.

## Upgrade

Update every NestBridge package to the same version:

```bash
yarn up nestbridge @nestbridge/vite
```

Use `@nestbridge/webpack` instead of `@nestbridge/vite` for webpack. The packages are released together, so keep them
on the same version — the generated code of a named app relies on the 2.2 `nestbridge` runtime, which knows about
`service`.

## What may need attention

### 1. The global prefix and versioning are now part of every URL

In 2.1 the plugin ignored `setGlobalPrefix()` and `enableVersioning()`, so the usual workaround was to write the
prefix into `baseURL`:

```ts
// main.ts
app.setGlobalPrefix('api');

// vite.config.ts (2.1)
nestBridge({ controllers: '...', baseURL: '/api' });
```

In 2.2 the prefix is read from `main.ts` and added to each route, so the same config now calls `/api/api/users`.
Pick one of:

- **Keep `baseURL` to the origin** (recommended). Remove the prefix from it:

  ```ts
  nestBridge({ controllers: '...', baseURL: 'https://example.com' });
  ```

  If the client and the server share an origin, you can drop `baseURL` altogether.

- **Keep the old behavior** and ignore the bootstrap file's prefix:

  ```ts
  nestBridge({ controllers: '...', baseURL: '/api', globalPrefix: false });
  ```

The same applies to URI versioning. When `main.ts` calls `app.enableVersioning({ type: VersioningType.URI })`, each
route gets a `/v<version>` segment (`@Controller({ version: '1' })`, `@Version('2')` or `defaultVersion`) — including
`@Version` decorators that 2.1 ignored. If you had put that segment in `baseURL`, remove it, or set
`versioning: false`.

A route excluded from the prefix (`setGlobalPrefix('api', { exclude: ['health'] })`) skips only the prefix and still
carries its version.

### 2. A prefix or versioning call that cannot be read now fails a one-shot build

NestBridge never guesses. If `main.ts` has a call it cannot read statically — a prefix that is not a string literal, a
call inside a condition or made twice, an exclusion it cannot evaluate, or header/media-type versioning — it reports
an `unsupported-global-prefix` or `unsupported-versioning` diagnostic. Diagnostics throw in `vite build` / `webpack`
production builds and are only logged in watch and dev-server mode, so a project can first fail in CI.

```ts
// main.ts
app.setGlobalPrefix(process.env.API_PREFIX);   // unsupported-global-prefix
```

Fix it by stating the value in the plugin options, which replaces the detection and its diagnostics, or by turning
the detection off:

```ts
nestBridge({
  controllers: '...',
  globalPrefix: { prefix: 'api', exclude: ['health'] }, // or just 'api'
  versioning: { prefix: 'v', defaultVersion: '1' },
  // globalPrefix: false, versioning: false  — ignore the bootstrap file for that setting
});
```

Header and media-type versioning cannot be expressed in a URL, and NestBridge does not set the request headers they
need: use `versioning: false` and send the header yourself through `configureNestBridge({ headers })`.

### 3. A relative `root` resolves against the bundler's root

A relative `root` used to resolve against `process.cwd()`. It now resolves against Vite's `root` (`process.cwd()`
under webpack). The two differ only when Vite runs with a `root` other than the directory it was started from
(`vite --root`, or a `root` in the config). If you hit that, make the option absolute:

```ts
nestBridge({ controllers: 'src/**/*.controller.ts', root: resolve(__dirname, '../server') });
```

## What is new

None of these is required.

### `@Controller({ path, version })` and `@Version`

In 2.1 a controller declared with an options object produced an `unsupported-route` diagnostic and was skipped, and
`@Version('2')` on a method was ignored. Both are read now. Versions must be string literals (a non-literal version is
an `unsupported-route` diagnostic); an array uses its first entry and `VERSION_NEUTRAL` adds no segment. A version only
affects a URL when URI versioning is enabled.

### Several server apps in one client

`nestBridge()` accepts an array, one entry per app:

```ts
nestBridge([
  {
    name: 'identity',
    root: '../identity',
    controllers: 'src/**/*.controller.ts',
    baseURL: 'https://identity.example.com',
  },
  {
    name: 'store',
    root: '../store',
    controllers: 'src/**/*.controller.ts',
    baseURL: 'https://store.example.com',
  },
]);
```

With more than one entry, `name` is required and must be unique (a letter followed by letters, digits, `-` or `_`).
An entry has the same options as before, plus `name`, `bootstrap`, `globalPrefix` and `versioning`, and each app gets
its own origin, bootstrap file, response wrapper, error body, prefix and versioning.

Things to adjust when you adopt it:

- **Declarations move into a folder per app.** A named app writes to `<outputDir>/<name>/…`
  (`.nestbridge/identity/src/…`), so each app needs its own alias and `paths` entry:

  ```json
  {
    "compilerOptions": {
      "paths": {
        "@identity/*": ["../../.nestbridge/identity/apps/identity/src/*"],
        "@store/*": ["../../.nestbridge/store/apps/store/src/*"]
      }
    }
  }
  ```

  The error body type moves too: `<outputDir>/<name>/nestbridge-error-body.d.ts`.

- **A single entry without a `name` keeps the 2.1 layout**: declarations stay flat in `<outputDir>`, and
  `baseURL` is registered globally with `setNestBridgeBaseURL`. Naming a single app opts it into the per-app layout.

- **A file belongs to one app.** If two entries' globs match the same controller or resolver file, the build fails
  (a warning in watch mode) and names both apps. Narrow the globs, or give each app its own `root`.

- **Use `bootstrap` when a `root` holds several `main.ts` files.** NestBridge reads the one `main.ts` under `root`;
  with none or several it reads nothing. `bootstrap: 'src/main.ts'` names the file, relative to `root`, and must
  exist.

### Runtime: `services`, per-app endpoints and `setNestBridgeServiceBaseURL`

A named app tags its generated requests with its `name` (`service`), and the runtime uses it to pick the origin:
`configureNestBridge({ services })`, then the origin the plugin registered with
`setNestBridgeServiceBaseURL(name, baseURL)`, then the global `setNestBridgeBaseURL`, then the bare path.

```ts
configureNestBridge({
  services: {
    identity: import.meta.env.VITE_IDENTITY_URL,
    store: import.meta.env.VITE_STORE_URL,
  },
});
```

`graphqlEndpoint` also accepts a record keyed by app name; a string still applies to every request. An existing
`configureNestBridge` call needs no change.

## Not covered

These are not modeled in 2.2. Each is reported where NestBridge can tell, and otherwise needs the option or workaround
shown:

- **Header, media-type and custom versioning** — `unsupported-versioning`; use `versioning: false`.
- **`RouterModule` paths** — not read. Put the module's path in the controller's `@Controller` path, or in `baseURL`
  for a whole app.
- **A GraphQL endpoint under the global prefix** — the prefix is not added to the GraphQL endpoint (Nest applies it
  only with `useGlobalPrefix`). Set `graphqlEndpoint` in `configureNestBridge` when the endpoint is not
  `baseURL` + `/graphql`.
- **Apps that are not declared** — apps are listed statically in the plugin options. NestBridge does not discover
  them or run their bootstrap code.

See the [README](README.md#several-server-apps) for the full description of each feature.
