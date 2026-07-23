## Context

Config is loaded through `@nestjs/config`'s `ConfigModule.forRoot` in `src/app.module.ts`, with six `registerAs` namespace factories in `src/config/*.config.ts` (`app`, `cors`, `database`, `jwt`, `redis`, `queue`) and env validation via a Zod schema in `src/config/validation.schema.ts` (exports a flat `EnvConfig` type, used only by `validateEnv`). Every injection site currently types `ConfigService` as the untyped default and calls `getOrThrow<T>('namespace.key')`, hand-supplying both the generic and the path string. Nothing ties these to the real shape produced by the `registerAs` factories.

`docs/architecture/index.md` requires code to be type-safe and to type all function params/returns; it has no config-specific guidance, and neither `event-architecture.md` nor `api-req-resp.md` touch configuration, so this change has no conflicting conventions to reconcile — it's a straightforward application of the "type safe" rule to an area that currently isn't.

## Goals / Non-Goals

**Goals:**
- Make `ConfigService.get` / `.getOrThrow` calls fail to compile on an invalid namespaced key (e.g. `'jwt.scret'`) or a type mismatch.
- Derive the strict type from the existing `registerAs` factories so it can't drift from the real config shape (no hand-maintained duplicate interface).
- Update all current call sites to the strict form, removing now-redundant manual generics.

**Non-Goals:**
- No changes to env validation, `.env.example`, or the Zod schema — `EnvConfig` (flat, pre-namespacing) stays as-is for `validateEnv`.
- No new config namespaces (e.g. Typesense) — out of scope for this change.
- No behavior change at runtime; this is compile-time-only.

## Decisions

- **Derive the strict type from `ConfigType<typeof factory>` per namespace, combined into one interface.** Using Nest's `ConfigType` utility on each `registerAs` factory (`ConfigType<typeof appConfig>`, etc.) keeps the type in sync with the factory automatically — if a config file adds/renames a field, the combined type updates without manual edits. Alternative considered: hand-write a `namespace.key: type` interface — rejected because it duplicates the factories and can silently drift out of sync.
- **Combined type lives in `src/config/index.ts`** as an exported `AppConfig` interface, keyed by namespace (`app`, `cors`, `database`, `jwt`, `redis`, `queue`), each value being that namespace's `ConfigType<...>`. This keeps all config-related exports (`*Config` factories, `validateEnv`, `EnvConfig`, and now `AppConfig`) in the single existing barrel file rather than adding a new file for one type.
- **Injection sites type the constructor param as `ConfigService<AppConfig, true>`**, not a new DI token. `ConfigService` is already a generic class from `@nestjs/config`; changing the type annotation at each injection point is sufficient — no changes to `ConfigModule.forRoot` or provider wiring are needed. The `true` second type parameter puts `ConfigService` in "strict" mode, which is what makes `getOrThrow('jwt.secret')` both key- and type-checked.
- **Drop manual generics at call sites** by fetching the whole namespace object via its top-level key (e.g. `getOrThrow('jwt')`) and using plain property access for individual fields (e.g. `jwtConfig.secret`), rather than calling `getOrThrow` with a dotted path (e.g. `getOrThrow('jwt.secret')`). `@nestjs/config`'s `getOrThrow`/`get` only type-check a single-argument call against the generic's **top-level** keys (`KeyOf<K>`); dotted-path checking requires an explicit `{ infer: true }` options argument on every call. Fetching the namespace object once avoids that boilerplate entirely: the namespace key is checked against `AppConfig`'s top-level keys, and every field on the returned object is checked by plain TypeScript property access against that namespace's own type — no manual generics, no per-call options object.
- **Leave the `expiresIn: ... as any` casts in `auth.module.ts` / `user.module.ts` untouched** — that cast exists to satisfy `@nestjs/jwt`'s `SignOptions['expiresIn']` type, not a `ConfigService` typing gap, and is out of scope.

## Risks / Trade-offs

- [Combined `AppConfig` interface must be kept as the single source of truth] → Enforced structurally: it's built from `ConfigType<typeof factory>`, so any future config file change automatically flows through without touching `AppConfig` itself.
- [Strict mode changes `get`/`getOrThrow` return types from `T | undefined` / `T` to values based on the declared shape, which could reveal latent type mismatches at existing call sites] → Expected and desirable; any such compile errors surfaced during this change should be fixed as part of the same PR since they represent genuine gaps this change is meant to catch.
- [Nest's strict-mode key inference only supports one level of dot-nesting well for large union types before TS tooling slows down] → Not a concern here; only six flat namespaces with a handful of keys each.

## Migration Plan

1. Add the `AppConfig` type to `src/config/index.ts`.
2. Update each of the seven injection sites to `ConfigService<AppConfig, true>` and drop manual generics on `getOrThrow` calls.
3. Run `tsc`/build to catch any path or type mismatches surfaced by strict mode; fix them inline.
4. No deploy/runtime migration or rollback steps needed — this is a type-level-only change with no behavior difference.

## Open Questions

None.
