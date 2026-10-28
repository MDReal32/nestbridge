---
"@nestbridge/core": minor
"@nestbridge/runtime": minor
"@nestbridge/unplugin": minor
"nestbridge": minor
---

Add microservice controllers. `@EventPattern()` and `@MessagePattern()` handlers on `@Controller()` classes become a third transport, next to HTTP routes and GraphQL resolvers, turned on per app with the new `messagePatterns: true` option (off by default; it needs the app's `name`, which addresses the service). The generated class keeps its HTTP methods and gains one method per handler: an event method emits and resolves with `void`, a message method sends and resolves with the handler's result, unwrapping a `Promise` and taking the last value of an `Observable`. The payload is the `@Payload()` parameter, or the first parameter when none is decorated.

Patterns must be statically known: a string or number literal, an object literal of those, or a constant whose type is a literal or an `as const` object. Anything else gives an `unsupported-message-pattern` diagnostic and drops the method. `analyzeControllers()` takes a `{ messagePatterns }` option, and `ControllerDefinition` gains `messageHandlers`.

The runtime adds a `@nestbridge/runtime/microservices` subpath, re-exported as `nestbridge/microservices`, with `configureNestBridgeMicroservices({ clients, defaultClient })`, `closeNestBridgeMicroservices()`, `emitMessage()`, `sendMessage()`, `NestBridgeMicroserviceError` and the `NestBridgeMessageResult` type. `@nestjs/microservices` is an optional peer dependency, and the main entry does not import it. This replaces nestrelay; see MIGRATION.md.

Builds that use the same app name for the same server now record which build generated its shared declarations in `.nestbridge/<name>/…/nestbridge-app.json`. A build that configures that app differently (`messagePatterns` or the bootstrap file) reports an error naming the other build and does not overwrite its declarations.
