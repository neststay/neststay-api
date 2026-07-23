## Why

All `ConfigService` access in the codebase (`main.ts`, `auth.module.ts`, `jwt.strategy.ts`, `user.module.ts`, `cache.service.ts`, `prisma.service.ts`, `queue.module.ts`) uses `configService.getOrThrow<T>('namespace.key')` with a hand-typed generic and a hand-typed dotted string path. Neither is checked against the actual `registerAs` config shape defined in `src/config/*.config.ts`, so a typo'd key or a wrong value type compiles without error and only surfaces as a runtime crash via `getOrThrow`. GitHub issue #1 tracks this gap.

## What Changes

- Introduce a combined config type derived from the existing `registerAs` factories (`app`, `cors`, `database`, `jwt`, `redis`, `queue`) in `src/config/`.
- Type the injected `ConfigService` as `ConfigService<AppConfig, true>` (or equivalent strict-mode typing) wherever it is injected, so `get`/`getOrThrow` calls are checked against real namespaced keys and value types at compile time.
- Update every existing `getOrThrow<T>('namespace.key')` call site to drop the manual generic/string typing in favor of the strict, inferred form.
- Remove now-redundant manual generics (e.g. `getOrThrow<string>(...)`) where the strict type already supplies the correct type.

## Capabilities

### New Capabilities
- `typed-config-service`: Compile-time-checked access to application configuration via a strictly-typed `ConfigService`, covering all existing config namespaces (`app`, `cors`, `database`, `jwt`, `redis`, `queue`).

### Modified Capabilities
(none — no existing spec capability covers config access typing)

## Impact

- `src/config/index.ts` (or a new type module) — export the combined strict config type.
- `src/main.ts`, `src/auth/auth.module.ts`, `src/auth/strategies/jwt.strategy.ts`, `src/user/user.module.ts`, `src/cache/cache.service.ts`, `src/prisma/prisma.service.ts`, `src/queue/queue.module.ts` — update `ConfigService` injection/typing and call sites.
- No runtime behavior change; no new env vars; no API/DB impact.
