## Why

Laravel Debugbar gave visibility into the number and shape of DB queries executed per request. This Nest + Prisma API has no equivalent, making it hard to spot N+1 queries or unexpected query volume during development. GH-7 asks for a dev-only mechanism that surfaces per-request query count, duration, and SQL.

## What Changes

- Enable Prisma query event logging (`log: [{ emit: 'event', level: 'query' }]`) on `PrismaService`, active only when the `APP_DEBUG` env var is `true`.
- Add an `AsyncLocalStorage`-based context to correlate emitted query events with the request that triggered them (the Prisma client is a singleton, so concurrent requests would otherwise interleave).
- Add a global, dev-only NestJS interceptor that opens an ALS context per request, collects queries pushed by the Prisma `query` event handler, and on response:
  - Logs a summary (query count, total duration, SQL list) via `Logger`.
  - Sets an `X-Query-Count` response header.
- No behavior change when `APP_DEBUG` is `false` (the default): no event listener registered, no interceptor active, no added overhead.

## Capabilities

### New Capabilities
- `dev-query-logging`: Per-request correlation and reporting of Prisma queries (ALS context, collecting interceptor, log summary, `X-Query-Count` header), active only when `APP_DEBUG` is `true`.

### Modified Capabilities
- `prisma-setup`: `PrismaService` gains conditional query event logging (`log: [{ emit: 'event', level: 'query' }]`) gated by the `APP_DEBUG` flag, and exposes a way for the query-logging interceptor to subscribe to emitted query events.

## Impact

- `src/config/validation.schema.ts` and `src/config/app.config.ts`: add `APP_DEBUG` (boolean, default `false`) to the validated `app` config namespace.
- `.env` / `.env.example`: add `APP_DEBUG` entry.
- `src/prisma/prisma.service.ts`: construct `PrismaClient` with event-based query logging when `appConfig.debug` is `true`; expose the query event subscription.
- New interceptor + ALS context module (e.g. `src/prisma/query-logging/`).
- `src/app.module.ts` (or `main.ts`): register the interceptor globally, gated by `appConfig.debug`.
- No database schema or API contract changes; no runtime behavior change when `APP_DEBUG` is left at its default (`false`).
