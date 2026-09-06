## Core Principles

- Prefer clarity to compactness and maintainable code over clever code.
- Prefer explicit structure, ownership, and predictable behavior.
- Preserve existing behavior unless the task explicitly changes it.
- Keep changes scoped. Clean related duplication and obsolete code in the touched area, but avoid unrelated repository-wide rewrites.
- Do not preserve bad local patterns only because they already exist; move touched code toward the best proven local pattern.
- Before using a library, framework, runtime, generator, or tool, verify the installed version first, then check official docs/types/source for that version, then search the repository for existing usage.
- Never code against guessed library behavior or stale memory when the repository can be checked.
- Prefer non-deprecated APIs when the installed version marks an API deprecated.
- Optimize for reviewability, not for fewer files.

## Structure & Ownership

- One file should have one clear responsibility.
- Prefer one file = one entity. If a second meaningful entity is needed, move it into its own file unless a documented technology-specific exception applies.
- One function = one purpose. One class/service = one responsibility.
- Prefer standalone functions for pure logic. Do not create classes only to group helper functions.
- Organize source code as a tree by the strongest ownership axis: domain, feature, runtime, layer, responsibility, provider, adapter, integration, module, protocol, transport, or platform.
- Keep source roots minimal and intentional. New features should extend the tree instead of polluting the root.
- Shared code must be promoted deliberately behind an explicit stable boundary. Do not reach into another module/package/app's internals.
- Avoid circular dependencies and hidden cross-module coupling.
- Do not create dumping-ground files or folders.
- Use descriptive domain-specific names. Avoid vague names such as `helper`, `utils`, `manager`, `processor`, `common`, `misc`, or `doStuff` when a precise name is available.
- Refactor the touched scope when a file becomes multi-purpose, a function becomes too large, responsibilities become mixed, unsafe casts appear, duplicated mapping appears, or unstable cross-module imports grow.

## Functions, Control Flow & Side Effects

- Avoid god classes, god services, deeply nested condition trees, nested ternaries, giant inline ternaries, giant one-line objects, and giant one-line conditions.
- Avoid premature abstractions, generic engines, reflection-heavy meta-programming, and magic auto-registration unless repeated concrete need proves they are justified.
- Prefer guard clauses when they improve readability. Guard clauses must use braces.
- Object literals with more than three properties should be multiline.
- Do not hide expensive I/O, network calls, storage operations, native bridge calls, or other significant side effects behind getters or seemingly pure helpers.

## Errors, Logging & Comments

- Never swallow errors silently. Never use an empty `catch {}`.
- Handle errors at the boundary where meaningful recovery, translation, logging, or presentation can occur.
- Fail explicitly instead of silently falling back.
- Logs should be structured and meaningful. Do not use `console.log` in application code.
- Default to no comments. Prefer clearer naming or extraction over explanatory inline comments.
- Never use inline `//` comments for narration or explanation. If an explanation must live in code, use rare JSDoc above the declaration for a hidden constraint, verified external-system quirk, or non-obvious invariant.

## TypeScript

### General

- Use strict TypeScript.
- Never use `any` unless compatibility with an external library genuinely requires it. Prefer `unknown` and narrow explicitly.
- Avoid unsafe casts such as `as unknown as`.
- Use `import type` for type-only imports.
- Use named exports and named imports. Do not use default exports.
- Prefer `async`/`await` and keep asynchronous work explicit.

### Object Types

- Use `interface` for object shapes and public object contracts.
- Do not write anonymous inline object type annotations such as `value: { id: string; name: string }`, including for parameters, variables, properties, callbacks, destructured arguments, or other implementation annotations.
- If an object shape needs an explicit annotation, use an existing named interface when appropriate or create a named `interface` for that shape.
- Use `type` for unions, intersections, mapped types, conditional types, primitive aliases, tuples/function aliases, and cases that interfaces cannot express cleanly.
- Do not duplicate types or create separate DTO/domain/view-model types unless an actual boundary requires them.
- Prefer deriving related types from existing source types instead of repeating object shapes. Use TypeScript utility and indexed-access types such as `Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `Record`, `Extract`, `Exclude`, `NonNullable`, and `T[K]` when they express the relationship clearly.
- Do not use utility types mechanically when they make the contract harder to understand; create a dedicated named type when it represents a genuinely distinct boundary or domain concept.
- When a union contains multiple object variants, prefer named object shapes and combine them into a union rather than writing a large unreadable inline union.
- Use generics only when they reduce duplication and improve clarity. Do not create type puzzles.

### Functions & Return Types

- Default to `const` arrow functions for standalone functions.
- Avoid `function` declarations unless technically required or significantly clearer. Class methods stay normal methods; object methods may use method syntax; callbacks remain arrow functions.
- Do not add explicit return type annotations to TypeScript function or method implementations. Always rely on TypeScript return-type inference when the language can infer the type.
- This rule applies to standalone functions, arrow functions, class methods, async functions, React components, hooks, callbacks, service methods, controller methods, utilities, and factory functions.
- Do not preserve an explicit return type merely because it already exists in touched implementation code; remove it when TypeScript can infer the return type correctly.
- Explicit return types are allowed only when structurally required by TypeScript or by a declaration-only contract, such as overload signatures, abstract method declarations, interface/type function signatures, declaration files, or cases where inference is technically impossible or incorrect. Readability alone is not an exception.

### Modules, Files & Public Boundaries

- Do not deep-import internal implementation details from another feature or package; use its public boundary.
- Do not create barrel files that blindly re-export everything. Public exports must be deliberate.
- TypeScript module and folder names use lowercase kebab-case unless a framework-specific rule overrides it.
- A filename should reflect the entity it contains. Avoid suffix noise such as `.type.ts` or `.function.ts` when the base name already communicates the entity clearly.
- Related constants may live together in a dedicated constants file when that keeps ownership clear. Do not scatter bare module constants through unrelated service/controller/module files.
- `src/main.ts` is an allowed entrypoint exception to one-entity-per-file and should stay limited to bootstrap, initialization, configuration loading, dependency wiring, and startup.
- Libraries expose their public surface through an explicit boundary such as `src/index.ts`; internal files still follow the normal ownership structure.

## NestJS

### Module Boundaries

- One module represents one domain or one coherent domain slice.
- Preferred dependency direction is `controller -> service`.
- A service may depend on its own module's repositories, handlers, approved provider abstractions, and explicitly exported services from other modules.
- Do not call another module's repository, DTO, handler, module-local utility, or module-local type directly.
- If something becomes genuinely shared across modules, promote it deliberately to a stable shared boundary rather than deep-importing it.
- Keep provider-specific implementation details out of controllers and application orchestration when a dedicated provider/adapter boundary exists.

### Responsibilities

- Controllers stay thin.
- Services own application orchestration and use-case coordination.
- Repositories own persistence.
- `<module>.module.ts` owns Nest wiring only: imports, providers, controllers, and exports. It must not contain business logic, mapping logic, helpers, or domain orchestration.
- `<module>.controller.ts` owns route decorators, guards/decorators/pipes, request extraction, service calls, and returning service results. It must not contain business logic, persistence, provider logic, or large mapping logic.
- `<module>.service.ts` owns application orchestration and use-case coordination. It must not contain HTTP parsing concerns, raw persistence logic when a repository exists, vendor-specific provider implementation details, or hidden cross-module repository access.
- `<module>.repository.ts` owns DB reads/writes, persistence filtering, query construction, and transaction interaction. It must not contain business orchestration, controller concerns, DTO validation, or provider calls.
- Use handlers when a use-case becomes meaningful enough to split from a service, may be triggered from multiple entrypoints, or deserves isolated tests. Do not create handlers for trivial pass-through logic.

### Structure

- Default module structure may include `<module>.module.ts`, `<module>.controller.ts`, `<module>.service.ts`, `<module>.repository.ts`, and only-needed folders such as `database/`, `dto/`, `handlers/`, `types/`, and `utils/`.
- Do not create empty structural ceremony.
- Avoid vague module folders such as `common`, `shared`, `helpers`, `models`, `interfaces`, `entities`, `contracts`, `misc`, or `lib` as dumping grounds.
- Module-local `types/` contains types owned only by that module. Module-local `utils/` contains utilities owned only by that module.

### Validation & Contracts

- All external input must be validated at the edge.
- Prefer Zod with `nestjs-zod` and `createZodDto` for DTO validation.
- DTO classes extend `createZodDto(schema)`.
- Do not define schemas inline inside DTO files; keep schemas in dedicated schema files and expose shared schemas through an explicit shared contract boundary when needed across apps/packages.
- Do not accept boundary payloads as anonymous inline object types when a named DTO or named type should define the contract.
- Event names should be stable, dot-separated, and centralized rather than invented ad hoc across files.

## React Native

- React Native component filenames use PascalCase, for example `AnimeCard.tsx` or `VideoPlayer.tsx`.
- Stay consistent with the existing component/file naming convention inside each package or feature.

## Drizzle

- A Drizzle table file owns one persistence entity.
- The table and its directly inferred `$inferSelect` / `$inferInsert` types stay in the same file; treat them as one persistence entity.
- Do not create separate files only for directly inferred select/insert aliases.
- Separate enum definitions, relation definitions, or reusable column builders only when they have their own meaningful responsibility.

## Zod

- A `*.schema.ts` file may keep a schema together with its directly inferred `z.infer` type and meaningful derived variants from that schema.
- Schema files must not contain unrelated functions, classes, enums, constants, or trivial duplicate aliases.
- This is an explicit exception to one-file-one-entity because the schema and its inferred type represent the same contract.

## Nx

- Prefer running build, lint, test, e2e, and similar workspace tasks through Nx rather than directly through the underlying tooling.
- Prefix Nx commands with the workspace package manager instead of relying on a globally installed CLI.
- For workspace navigation, project relationships, targets, and dependencies, use Nx-aware workspace tooling when available.
- Verify unfamiliar Nx CLI flags before using them; do not guess flags.
- For scaffolding, use the appropriate Nx generator workflow rather than manually inventing project structure when a generator is intended.
- Use Nx documentation for advanced configuration, unfamiliar flags, migrations, plugin configuration, and edge cases rather than for routine syntax already known from the workspace.