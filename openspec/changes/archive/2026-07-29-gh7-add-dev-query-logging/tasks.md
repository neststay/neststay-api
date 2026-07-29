## 1. Config: APP_DEBUG flag

- [x] 1.1 In `src/config/validation.schema.ts`, add `APP_DEBUG: z.enum(['true', 'false']).default('false').transform((value) => value === 'true')`, following the existing `ENABLE_BULL_BOARD` pattern
- [x] 1.2 In `src/config/app.config.ts`, expose `debug: process.env.APP_DEBUG === 'true'` on the `app` namespace
- [x] 1.3 Add `APP_DEBUG=false` to `.env.example` and an appropriate value to `.env`

## 2. Query-log context

- [x] 2.1 Create `src/prisma/query-logging/query-log.store.ts` exporting a singleton `AsyncLocalStorage<QueryLogEntry[]>` and a `QueryLogEntry` type (`{ query: string; params: string; duration: number }`)

## 3. PrismaService query event logging

- [x] 3.1 In `src/prisma/prisma.service.ts`, read `appConfig.debug` and conditionally construct `PrismaClient` with `log: [{ emit: 'event', level: 'query' }]` when `true` (omit `log` entirely when `false`)
- [x] 3.2 When logging is enabled, register `this.$on('query', handler)` where `handler` pushes a `QueryLogEntry` onto `queryLogStore.getStore()` if a store is active, and no-ops otherwise

## 4. Query-log interceptor and module wiring

- [x] 4.1 Create `src/prisma/query-logging/query-log.interceptor.ts` implementing `NestInterceptor`: run `next.handle()` inside `queryLogStore.run([], ...)`, and in `tap`/`finalize`, log a summary (count, total duration, SQL list) via `Logger` and set the `X-Query-Count` response header
- [x] 4.2 Add a trivial passthrough interceptor (or inline factory branch) that just calls `next.handle()` for the `APP_DEBUG=false` case
- [x] 4.3 Create `src/prisma/query-logging/query-logging.module.ts` providing `APP_INTERCEPTOR` via `useFactory` (inject `ConfigService`) that returns the passthrough interceptor when `appConfig.debug` is `false`, otherwise the real `QueryLogInterceptor`
- [x] 4.4 Import `QueryLoggingModule` into `src/app.module.ts`

## 5. Tests

- [x] 5.1 Unit test `PrismaService` (or its query handler) confirms `$on('query', ...)` is registered when `APP_DEBUG` is `true` and skipped when `false`
- [x] 5.2 Unit test `QueryLogInterceptor` confirms it collects queries pushed into the ALS store during handler execution and sets `X-Query-Count` correctly, including the zero-query case
- [x] 5.3 Unit/e2e test confirms the passthrough path when `APP_DEBUG` is `false`: no `X-Query-Count` header and no summary log

## 6. Verification

- [x] 6.1 Run the app with `APP_DEBUG=true`, hit an endpoint that queries the DB, confirm a log summary (count/duration/SQL) and `X-Query-Count` header appear
- [x] 6.2 Run the app with `APP_DEBUG=false` (or unset), confirm neither the summary log nor the header appear
- [x] 6.3 Run relevant lint/typecheck/test scripts and confirm they pass
