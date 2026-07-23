## ADDED Requirements

### Requirement: Compile-time-checked config access
The system SHALL provide a combined configuration type, derived from the existing `registerAs` namespace factories (`app`, `cors`, `database`, `jwt`, `redis`, `queue`), that is used to type every injected `ConfigService` in strict mode so that namespaced config paths and their value types are checked by the TypeScript compiler.

#### Scenario: Valid namespace key compiles and infers the correct namespace shape
- **WHEN** a module calls `configService.getOrThrow('jwt')` on a strictly-typed `ConfigService`
- **THEN** the call compiles and the inferred return type is the `jwt` namespace's full shape (e.g. `{ secret: string; expiresIn: string }`), so `jwtConfig.secret` is typed as `string`

#### Scenario: Invalid field access fails to compile
- **WHEN** a module accesses `jwtConfig.scret` (a typo'd field) on the object returned by `configService.getOrThrow('jwt')`
- **THEN** the TypeScript compiler reports a type error and the build fails, instead of the error only surfacing at runtime via a thrown exception

#### Scenario: Invalid namespace key fails to compile
- **WHEN** a module calls `configService.getOrThrow('jwtt')` (a typo'd namespace) on a strictly-typed `ConfigService`
- **THEN** the TypeScript compiler reports a type error and the build fails, instead of the error only surfacing at runtime via a thrown exception

#### Scenario: Combined config type stays in sync with namespace factories
- **WHEN** a `registerAs` factory in `src/config/*.config.ts` adds, removes, or renames a field
- **THEN** the combined configuration type reflects that change automatically without requiring a manually maintained duplicate interface

### Requirement: Existing config call sites use strict typing
The system SHALL type every `ConfigService` injection across the codebase (`src/main.ts`, `src/auth/auth.module.ts`, `src/auth/strategies/jwt.strategy.ts`, `src/user/user.module.ts`, `src/cache/cache.service.ts`, `src/prisma/prisma.service.ts`, `src/queue/queue.module.ts`) using the strict combined configuration type, without manually restating the value type on each `get`/`getOrThrow` call.

#### Scenario: Call site relies on inferred namespace typing instead of a manual generic or dotted path
- **WHEN** an injection site previously called `configService.getOrThrow<string>('database.url')`
- **THEN** after this change it calls `configService.getOrThrow('database')` once to get the namespace object, then accesses `databaseConfig.url`, receiving a `string`-typed result inferred from the strict `ConfigService` type rather than a manually supplied generic or a dotted-path string
