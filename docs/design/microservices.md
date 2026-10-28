# Design: microservice controllers in NestBridge (absorbing nestrelay)

Status: proposal · Target: nestbridge 2.6.0 (minor, additive)

## 1. Goal

Libramigo's `libs/nestrelay` does for `@EventPattern` / `@MessagePattern` handlers what NestBridge does for
HTTP routes and GraphQL resolvers: the caller imports the provider's class, and at build time the import becomes a generated
client. Today this means two plugins, two output folders, two import conventions and two runtime configs.
`apps/server/admin-panel` already runs both side by side.

The goal is **one product**. Message-pattern handlers become a third transport of NestBridge, next to HTTP and
GraphQL, and follow the same conventions as the other two. "nestrelay" is not added as a sub-product. The
name, the `@nestrelay/*` specifier, `.nestrelay/` and `configureNestRelay` all go away.

Non-goals for this release:
- Building a caller without the provider's source. nestrelay's manifest feature is dropped; see section 8.
- Validating the payload at the call site.
- Nest module wrappers.

## 2. What the user sees

### Before (Libramigo admin-panel today)

```ts
plugins: [
  nestRelayUnplugin.vite(),
  nestBridge({ name: 'catalog', root: '../catalog', controllers: 'src/**/*.controller.ts', resolvers: 'src/**/*.resolver.ts' }),
],
resolve: { alias: { '@catalog': path.resolve(import.meta.dirname, '../catalog/src') } },
```
```ts
import { EmailsController } from '@nestrelay/notifications/emails/emails.controller';
```

### After

```ts
plugins: [
  nestBridge([
    { name: 'catalog', root: '../catalog', controllers: 'src/**/*.controller.ts', resolvers: 'src/**/*.resolver.ts' },
    { name: 'notifications', root: '../notifications', controllers: 'src/**/*.controller.ts', messagePatterns: true },
  ]),
],
resolve: {
  alias: {
    '@catalog': path.resolve(import.meta.dirname, '../catalog/src'),
    '@notifications': path.resolve(import.meta.dirname, '../notifications/src'),
  },
},
```
```ts
import { EmailsController } from '@notifications/emails/emails.controller';
```
```ts
// main.ts of the caller, once
import { configureNestBridgeMicroservices } from 'nestbridge/microservices';

configureNestBridgeMicroservices({
  defaultClient: (service) => ({
    transport: Transport.RMQ,
    options: { urls: [env.RABBITMQ_URL], queue: `${service}_queue`, queueOptions: { durable: true } },
  }),
});
```

The tsconfig `paths` entry points at `.nestbridge/apps/server/notifications/src/*`, like every other NestBridge client.
`"@nestrelay/*"` disappears from `tsconfig.base.json`.

## 3. Key decisions

| # | Decision | Why |
|---|----------|-----|
| D1 | **Message-pattern handlers live on the existing `controllers` entry.** There is no separate glob. A new per-app flag, `messagePatterns: true`, turns them on. | In Nest they are methods of `@Controller()` classes, and one controller can mix routes and patterns. A second glob over the same files would make two owners for one file. The flag is off by default, so browser clients never receive microservice code. |
| D2 | **One generated class per controller**, with HTTP methods and message methods side by side. | The class the caller imports is the class the server wrote. This is the "normal output, not just merged" requirement. |
| D3 | **Explicit app entries instead of workspace auto-discovery.** | It matches how NestBridge finds HTTP and GraphQL code, works the same in webpack, does not scan the whole workspace, and the service name comes from `name` instead of a directory name. Cost: one config entry per provider, and Libramigo has one. |
| D4 | **Real-path imports plus the `transform` hook, not a virtual `@nestrelay/` specifier.** | This is the same mechanism as the other transports. Go-to-definition reaches the server code, and the user's alias stays an ordinary alias. |
| D5 | **Runtime lives in a subpath: `@nestbridge/runtime/microservices`, re-exported as `nestbridge/microservices`.** `@nestjs/microservices` is an *optional* peer dependency. | The main runtime stays browser-safe and dependency-free. Only apps that use message patterns load Nest's client code. |
| D6 | **No built-in RabbitMQ default.** The caller supplies `clients` per service and/or a `defaultClient(service)` factory. | `RABBITMQ_URL` and `<service>_queue` are Libramigo conventions, not library conventions. A missing client fails with a clear error that names the service. |
| D7 | **Generated classes stay plain classes, without `Injectable()`.** | Nest instantiates a provider with no constructor dependencies without `@Injectable`. Admin-panel already registers NestBridge GraphQL clients this way (`providers: CATALOG_CLIENTS`). This drops the `@nestjs/common` import from generated code. |
| D8 | **Analysis errors become diagnostics, not exceptions.** | This matches NestBridge: one bad handler drops that method with a located diagnostic instead of failing the whole build in watch mode. |
| D9 | **Analysis is ported to the TS 7 API** (`typescript/unstable/sync`, whose `Checker` provides `getTypeAtLocation`, `getPropertiesOfType` and literal types). | This keeps one compiler in the repo. The type checker is needed only for `const` / `as const` patterns. |

## 4. Architecture by package

### `@nestbridge/core` (analysis and declarations)

```
src/analysis/
  extract-controller-definition.ts      (changed) also collects message handlers when asked
  extract-message-handler-definition.ts (new)     @EventPattern / @MessagePattern → MessageHandlerDefinition
  read-message-pattern.ts               (new)     literal / object literal / const via checker
  read-literal-type.ts                  (new)     checker type → MessagePattern
  find-payload-parameter-index.ts       (new)     @Payload, else first undecorated param, none with @Ctx-only
  parse-source-file.ts                  (changed) also exposes the project's Checker
src/models/
  message-handler-definition.ts         (new)  { name, kind, pattern, payloadParameterIndex, line, column }
  message-kind.ts                       (new)  'event' | 'message'
  message-pattern.ts                    (new)  string | number | boolean | { [key: string]: MessagePattern }
  controller-definition.ts              (changed) + messageHandlers: MessageHandlerDefinition[]
src/declarations/
  generate-controller-declaration.ts    (changed) emits message methods too
src/diagnostics/nestbridge-diagnostic.ts (changed) + 'unsupported-message-pattern'
```

`analyzeControllers(files, { messagePatterns })` keeps its signature apart from the options object. A controller
that has only message handlers counts as a controller as soon as the flag is on.

### `@nestbridge/unplugin` (options, codegen, plugin)

```
src/options/nestbridge-options.ts          + messagePatterns?: boolean
src/options/resolved-nestbridge-options.ts + messagePatterns: boolean
src/options/validate-nestbridge-entries.ts + messagePatterns requires a `name`, which is the service name
src/codegen/generate-controller-module.ts  imports from 'nestbridge/microservices' only when the class has handlers
src/codegen/generate-message-method.ts     (new)
src/plugin/controller-registry.ts          passes the flag to analyzeControllers
```

The plugin flow (buildStart → analyze → write declarations → transform owned files → watchChange) does not change.
Message handlers ride along with controllers, so watch mode, locked writes, the workspace-root `.nestbridge/`
default and overlap detection all work without extra code. nestrelay's watch mode only partly worked; this fixes it as a side effect.

### `@nestbridge/runtime`

```
src/microservices-adapter/
  configure-nestbridge-microservices.ts  { clients?: Record<string, ClientOptions | ClientProxy>, defaultClient?: (service) => ClientOptions }
  close-nestbridge-microservices.ts      closes every client created so far
  get-microservice-client.ts             lazy, cached per service
  emit-message.ts                        emit, resolves once published
  send-message.ts                        send, resolves with the reply
  nestbridge-microservice-error.ts       missing client configuration, etc.
src/microservices.ts                     subpath entry
```

`package.json`: add an `./microservices` export and a `peerDependencies` entry for `@nestjs/microservices`
(optional, matched to the Nest 12 range Libramigo uses). The vite library config gets a second entry. `nestbridge`
adds a `./microservices` re-export.

## 5. Generated output

Server:
```ts
@Controller()
export class EmailsController {
  @Get('emails/:id') find(@Param('id') id: string) { … }
  @EventPattern(EMAIL_EVENTS.requested) handleEmailRequested(@Payload() request: EmailRequest) { … }
  @MessagePattern({ cmd: 'count' }) count() { … }
}
```

Module served for that file (`messagePatterns: true`, app `notifications`):
```ts
import 'virtual:nestbridge/config';
import { request } from 'nestbridge';
import { emitMessage, sendMessage } from 'nestbridge/microservices';

export class EmailsController {
  constructor() {}

  find(id) {
    return request({ method: "GET", path: `/emails/${encodeURIComponent(id)}`, service: "notifications" });
  }

  handleEmailRequested(payload) {
    return emitMessage({ service: "notifications", pattern: "email.requested", payload });
  }

  count() {
    return sendMessage({ service: "notifications", pattern: {"cmd":"count"}, payload: {} });
  }
}
```

Declaration in `.nestbridge/.../emails.controller.d.ts`, which extends the existing generator:
```ts
handleEmailRequested(payload: Parameters<S['handleEmailRequested']>[0]): Promise<void>;
count(): Promise<NestBridgeMessageResult<ReturnType<S['count']>>>;
```
`NestBridgeMessageResult<R>` unwraps `Observable<T>` or `Promise<T>` to `T`. It is exported from the runtime
instead of being inlined into every file.

## 6. Analysis rules (carried over from nestrelay)

- Pattern: a string or number literal, an object literal of those, or an identifier or property access whose type is a literal or an `as const` object. Anything else gives an `unsupported-message-pattern` diagnostic, and that method is dropped.
- Payload: the parameter with `@Payload()`. Otherwise the first parameter, unless the method uses `@Ctx()` only, in which case there is no payload. Other decorated parameters are treated as server-only, using the existing `serverOnlyParameterIndexes` mechanism.
- Method names must be plain identifiers. Only exported `@Controller()` classes count, as with HTTP.
- Handlers on a controller are ignored when `messagePatterns` is off, which is today's behaviour, so nothing changes for existing users.

## 7. Tests and examples

- core: unit tests ported from `analyze-program.spec.ts` and `generate-controller-declaration.spec.ts` onto fixtures, including a mixed HTTP + pattern controller and each pattern form (`const`, `as const`, a computed value giving a diagnostic).
- unplugin: codegen snapshot tests for mixed, events-only and messages-only classes, plus option validation (`messagePatterns` without `name`).
- runtime: `configure` / `close` / missing-client error, adapted from `relay.spec.ts`.
- `examples/microservices/{server,client}`: a real Nest microservice over **TCP transport**, so no broker is needed in CI. The test boots it, builds the client with Vite and calls an event and a message end to end. A typecheck fixture covers the payload type and result type.

## 8. What is dropped from nestrelay, and why

| nestrelay feature | Fate | Reason |
|---|---|---|
| Workspace auto-discovery | Dropped | D3. |
| `@nestrelay/<service>/<path>` specifier | Dropped | D4. |
| `manifest.json`, builds without provider source | Dropped for now | No caller in Libramigo needs it, and there are no per-app Dockerfiles. If needed later, it belongs to all transports (an HTTP client has the same limit), as a separate feature. |
| RabbitMQ default from `RABBITMQ_URL` | Moved to the caller | D6. Libramigo keeps the same behaviour with one `defaultClient` factory. |
| `Injectable()(Class)` | Dropped | D7. |
| Throwing `NestRelayAnalysisError` | Becomes diagnostics | D8. |

## 9. Delivery plan

1. **core**: models, TS 7 port of pattern and payload analysis, declarations, diagnostics, tests.
2. **unplugin**: `messagePatterns` option, validation, codegen, tests.
3. **runtime**: `microservices` subpath, optional peer, build entry, tests. Add the **nestbridge** `./microservices` re-export.
4. **examples/microservices** (TCP), README section, a MIGRATION.md entry ("from nestrelay"), and a changeset (minor).
5. **Libramigo**: switch admin-panel to the new config and imports, add the `defaultClient` factory, delete `libs/nestrelay`, `.nestrelay/` and the `@nestrelay/*` path, and update `docs/libs/nestrelay.md` to point here.

Steps 1 to 4 are one PR in this repo, released as 2.6.0. Step 5 is one PR in Libramigo after the release.

## 10. Open questions

1. **Flag name.** I propose `messagePatterns`. Alternatives are `microservices` or `transports: ['http', 'messages']`.
2. **Hybrid apps and `baseURL`.** An app with both HTTP routes and message patterns uses `baseURL` for one and the client config for the other. That is fine as long as both are keyed by `name`. Confirm.
3. **Observable results.** Should a `@MessagePattern` that returns `Observable<T>` stream (return an `Observable`) instead of resolving with the last value? nestrelay resolves with the last value. The proposal keeps that for 2.6.0.
