## Context

`PrismaService` (`src/prisma/prisma.service.ts`) constructs a single `PrismaClient` (via `PrismaPg` adapter) that is injected across the app as a `@Global()` provider. Because it is a singleton, any per-request instrumentation (e.g. Prisma's `query` log event) fires on a shared emitter — concurrent requests would have their query events interleaved unless each query is tagged with the request that issued it.

`main.ts` already has an `isProduction = appConfig.env === 'production'` flag that gates dev-only bootstrap behavior (Swagger docs, relaxed CSP, Bull Board). This change does not reuse that flag: it introduces a new `APP_DEBUG` env var (boolean, default `false`) so query logging can be toggled independently of `APP_ENV` — e.g. left off in local `development` when not needed, or turned on temporarily in another environment for debugging. `APP_DEBUG` is validated and normalized to a boolean in `src/config/validation.schema.ts` (same `z.enum(['true', 'false']).transform(...)` pattern already used for `ENABLE_BULL_BOARD`) and exposed via `app.config.ts`'s `app` namespace alongside `env`/`port`, so it is read the same way (`configService.getOrThrow('app')`).

Per `docs/architecture/index.md`: only services are injected across modules, repositories/queries stay out of controllers, and DTOs/typed boundaries are required. This change is infrastructure (observability), not a business capability — it introduces no repository, controller, or DTO surface. It lives under `src/prisma/` alongside `PrismaService` since it is tightly coupled to the Prisma client lifecycle.

## Goals / Non-Goals

**Goals:**
- Correlate Prisma queries to the request that triggered them, using `AsyncLocalStorage` (ALS).
- Log a per-request summary (query count, total duration, SQL list) via `Logger` when not running in production.
- Expose an `X-Query-Count` response header for a quick at-a-glance count, dev-only.
- Guarantee zero added listener/interceptor overhead in production.

**Non-Goals:**
- No UI/dashboard equivalent to Debugbar — console/log output only.
- No instrumentation of non-Prisma work (Redis, HTTP calls, queue jobs).
- No persistence of query logs beyond the process log stream.
- No query plan/EXPLAIN analysis — only what Prisma's `query` event already provides (SQL, params, duration).

## Decisions

**1. Where the ALS store lives**
A single module-level `AsyncLocalStorage<QueryLogEntry[]>` singleton in `src/prisma/query-logging/query-log.store.ts`, imported directly by both `PrismaService` (producer) and `QueryLogInterceptor` (consumer/owner of the context). Alternative considered: wrap the store in an injectable service. Rejected because ALS instances must be process-wide singletons regardless of DI scope, and NestJS's request-scoped providers already carry noticeable per-request overhead — a plain singleton module is simpler and avoids that cost entirely (relevant since this must be free in prod, and cheap in dev).

**2. Enabling Prisma query events conditionally**
`PrismaService` constructs `PrismaClient` with `log: [{ emit: 'event', level: 'query' }]` only when `appConfig.debug` is `true`; otherwise no `log` option is passed. When enabled, it registers `this.$on('query', handler)` in the constructor, where `handler` pushes `{ query, params, duration }` onto `queryLogStore.getStore()` if a store is active (i.e., a request is in flight). If no store is active (e.g. app bootstrap queries), the event is dropped. This keeps `PrismaService` as the single place that knows how to talk to Prisma's logging API, consistent with it owning the `PrismaClient` construction today.

**3. Correlating via a global interceptor, not middleware**
A `QueryLogInterceptor implements NestInterceptor` wraps the request in `queryLogStore.run([], () => next.handle())`. Interceptors (unlike middleware) run inside Nest's request pipeline and can access the same `ExecutionContext` used elsewhere in the app, and can use RxJS `tap`/`finalize` to run logic after the handler resolves but before the response is flushed — needed to set `X-Query-Count` and log the summary with the final query count. Middleware runs too early (before the ALS-wrapped handler executes) and can't easily observe completion in one place.

**4. Conditional registration via `APP_INTERCEPTOR` factory**
`QueryLoggingModule` provides `APP_INTERCEPTOR` via `useFactory` with `ConfigService` injected: if `appConfig.debug` is `false` (the default), it returns a trivial passthrough interceptor (`intercept: (_, next) => next.handle()`); if `true`, it returns the real `QueryLogInterceptor`. This works within Nest's static module/provider model (the factory runs at DI resolution time, after `ConfigModule` is initialized, so it can read `appConfig` even though `AppModule`'s decorator is static). Alternative considered: only register the provider at all when `appConfig.debug` is `false`, by branching the `providers` array passed to `@Module()`. Rejected because `AppModule`'s decorator metadata is evaluated once at import time using `process.env` directly, bypassing `ConfigService`/`validateEnv` — the factory approach keeps config access centralized through `ConfigService`.

**5. Header timing**
The `X-Query-Count` header is set synchronously inside the `tap` callback, before the observable completes. Nest's router subscribes to the interceptor chain's output and only calls `res.send()`/`res.json()` after that subscription's `next` fires, so a header set inside `tap` (which runs before the outer `next`) is guaranteed to land before the response is flushed. This is the same pattern commonly used for response-time headers.

## Risks / Trade-offs

- **[Risk]** ALS context loss if a query fires outside the interceptor's async chain (e.g. a background job also using `PrismaService` outside an HTTP request). → Mitigation: the `query` event handler checks `queryLogStore.getStore()` and no-ops when absent, so non-request Prisma usage (seeds, queue processors) is unaffected and simply isn't logged.
- **[Risk]** Verbose SQL logging on chatty endpoints could flood logs. → Mitigation: this is a dev-only tool by design (ticket's stated purpose is catching N+1s during development); no truncation is implemented now, but the log line format keeps count/duration first so it's scannable even with a long SQL list. Can be revisited if noisy in practice.
- **[Trade-off]** Gating on an explicit `APP_DEBUG` flag (rather than `APP_ENV`) decouples logging from environment entirely — it is off in `test` by default, but also stays off in `development` unless the flag is set in `.env`. This requires each environment to opt in explicitly rather than getting logging "for free" outside production, but it means `test` runs are quiet by default and any environment (including a `production`-like one) can opt in temporarily for debugging.
- **[Risk]** Passthrough interceptor and real interceptor are two code paths selected at factory time — a bug in the `appConfig.debug` check, or a missing/misconfigured `APP_DEBUG` value, could silently disable logging when wanted. → Mitigation: `APP_DEBUG` is validated via the same `z.enum(['true', 'false']).default('false')` pattern as `ENABLE_BULL_BOARD`, so an unset or invalid value fails safe to `false` (logging off) rather than failing open.
- **[Risk]** Because the gate is now a manually-set env var instead of being derived from `APP_ENV !== 'production'`, nothing in code stops `APP_DEBUG=true` from being set in a production `.env`, which would enable query logging (and its per-request overhead) in production — the "zero overhead in production" goal then depends on deployment hygiene rather than a code-level guarantee. → Accepted: `APP_DEBUG` defaults to `false` via the Zod schema, so the safe state is the default and no environment needs to opt out. No code-level production override is added; if this proves risky in practice, a future change could additionally AND the check with `appConfig.env !== 'production'`.

## Migration Plan

No data migration. Rollout is a standard deploy:
1. Add `APP_DEBUG` to `src/config/validation.schema.ts` (boolean, default `false`, same pattern as `ENABLE_BULL_BOARD`), expose it as `debug` on the `app` namespace in `src/config/app.config.ts`, and add `APP_DEBUG=` entries to `.env` and `.env.example`.
2. Ship `PrismaService` change (conditional `log` option + `$on('query', ...)` gated on `appConfig.debug`) and `QueryLoggingModule`.
3. Import `QueryLoggingModule` in `AppModule`.
4. Verify with `APP_DEBUG=true` that requests emit a log summary and `X-Query-Count` header, and verify both are absent when `APP_DEBUG` is `false` or unset.
5. Rollback is a plain revert — no schema or stateful changes are involved.

## Open Questions

None. (Previously open: whether `APP_DEBUG` should be forcibly ignored when `APP_ENV === 'production'` as a code-level safety net — resolved as not needed, since the flag defaults to `false` and requires explicit opt-in in any environment.)
