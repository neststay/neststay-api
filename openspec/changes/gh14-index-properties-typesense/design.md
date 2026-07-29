## Context

Properties are persisted in Postgres via `PropertyModule` (`PropertyService` → `PropertyRepository`). There is no search capability today. The codebase already has one precedent for "domain event → BullMQ queue → processor": user registration emits `user.register` via `EventEmitter2`, a listener in `UserModule` picks it up, and the shared, `@Global()` `QueueModule` (`src/queue/`) owns the `user-events` queue, its producer (`QueueProducerService`), and its processor.

This change introduces a second pipeline — property creation → Typesense indexing — but deliberately does **not** extend the shared `QueueModule`. Per `docs/architecture/index.md`, only services are injected/exported across modules, repositories never leave their module, and controllers only call services. Those rules constrain how the new `search` module is allowed to reach into `PropertyModule`.

## Goals / Non-Goals

**Goals:**
- Emit a `property.created` event on property creation, decoupled from any search concerns.
- Stand up a `search` module that owns a dedicated `search_queue`, its own producer (retry/backoff config) and processor.
- Idempotently create the Typesense `properties` collection schema on bootstrap.
- Index a property's searchable/facetable fields into Typesense asynchronously after creation.

**Non-Goals:**
- Keeping the Typesense index in sync on property update or delete (explicit follow-up).
- Backfilling existing properties into Typesense.
- Any read-side search/query API against Typesense.
- Generalizing `search_queue` to handle non-property job types.

## Decisions

**1. `search` module owns its own queue, not the shared `QueueModule`.**
The existing `QueueModule` is `@Global()` and centralizes all queue registration/producers/processors under `src/queue/`. This change instead has `SearchModule` call `BullModule.registerQueue({ name: SEARCH_QUEUE })` itself and keep its producer/processor local to `src/search/`. Rationale: `search_queue` and its retry semantics are entirely a search/Typesense concern, not a generic one — decentralizing avoids `QueueModule` growing into a dumping ground as more domains add job types, and keeps the Typesense-related code (schema, mapping, client) in one place. Trade-off: two places now define "how a BullMQ queue is registered" instead of one; acceptable since the registration boilerplate is a few lines and BullMQ's root connection config (`BullModule.forRootAsync`) stays centralized in `QueueModule` — only the per-queue registration is local.

**2. Event payload and job payload carry only the property `slug`, not the numeric `id`.**
`property.id` is a Postgres `BigInt`, which is not JSON-serializable — BullMQ persists job data as JSON in Redis, so this exact issue already forced the existing `user.register` listener to call `.toString()` on the id before enqueueing. Using `slug` (already a string, already the public-facing identifier per `docs/architecture/index.md`) avoids that conversion entirely and lets the processor reuse the existing `PropertyService.getBySlug` method — no new by-id lookup needs to be added to `PropertyService`.

**3. `PROPERTY_CREATED_EVENT` constant lives in `property` module; `SEARCH_QUEUE` and job-name constants live in `search` module.**
The event name is owned by its emitter (`src/property/property.constants.ts`); the queue/job identifiers are owned by their consumer (`src/search/search.constants.ts`). The search module imports `PROPERTY_CREATED_EVENT` and reuses it as the BullMQ job name (rather than defining a second, identical string) since there is currently a 1:1 mapping between the event and the job. Importing a plain string constant across modules does not violate the "only services are injected/exported" rule — that rule concerns DI, not literals.

**4. Typesense collection schema is created idempotently on application bootstrap.**
Typesense has no built-in migration system comparable to Prisma's. `SearchModule`'s Typesense client provider runs `onModuleInit`, calls `collections().create(schema)`, and swallows the "already exists" error (HTTP 409). This mirrors how the rest of the app already treats schema/config as something the app owns at startup (e.g. `ConfigModule.forRoot` validation), and avoids introducing a new manual deploy step. Trade-off: schema changes to the collection (e.g. adding a facet field later) still require either dropping/recreating the collection or a follow-up alias-swap migration — not solved by this change.

**5. Typesense document includes both `locationId`/`placeTypeId` (exact filter) and `locationName`/`placeTypeName` (facet display), plus `id` (property's own id) for internal tracking.**
The existing DB-backed listing endpoint already filters properties by `locationId` (`PropertyRepository.findAllPaginatedByLocation`); search filtering needs the same exact-match capability, which name-only faceting can't guarantee (two locations could share a display name; a rename would silently change facet values with no stable anchor). This intentionally deviates from the `docs/architecture/index.md` guidance to "strip identity fields (`id`) from embedded relations" in API response DTOs — that rule governs client-facing response shapes, not an internal search index document, and the ids here exist for filtering/tracking, not because a relation is being embedded into a public response.

**6. Indexing failures are isolated and do not affect property creation or retry indefinitely.**
`PropertyService.create` emits the event synchronously but does not await any queue/network operation — creation succeeds regardless of search availability. The listener catches and logs any error from the producer (matching `UserRegisterQueueListener`'s existing pattern) rather than letting it propagate into the `EventEmitter2` dispatch. BullMQ's own retry/backoff (attempts: 3, exponential, 1s base) handles transient Typesense/Redis failures within the processor.

## Risks / Trade-offs

- **[Risk]** A property created while Typesense is down will exhaust its 3 retries and remain unindexed with no automatic recovery. → **Mitigation**: out of scope for this change to solve fully (no backfill/reconciliation job), but BullMQ's `removeOnFail: false` keeps the failed job visible in Bull Board for manual reprocessing.
- **[Risk]** Collection schema changes after initial creation aren't handled by the idempotent bootstrap approach (create-if-not-exists only patches the "doesn't exist yet" case). → **Mitigation**: accepted for this change; a schema-versioning/migration approach is future work if the schema needs to evolve.
- **[Risk]** Two independent `BullModule.registerQueue` call sites (`QueueModule`, `SearchModule`) could drift in retry/backoff conventions over time. → **Mitigation**: this change intentionally mirrors the exact defaults used by `QueueProducerService.enqueueUserRegister`; future queues should follow the same convention even if registered locally.

## Migration Plan

1. Add `typesense` dependency, `typesense.config.ts`, and validation/`.env.example` entries.
2. Add `PROPERTY_CREATED_EVENT` constant and emit it from `PropertyService.create`.
3. Build `search` module (queue registration, constants, listener, producer, processor, Typesense client provider + collection schema).
4. Register `SearchModule` in `AppModule`.
5. Deploy: on first boot, the collection is created automatically; no manual migration step. Existing properties remain unindexed until this change's explicit non-goal (backfill) is addressed separately.

No rollback concerns beyond removing `SearchModule` from `AppModule` imports — property creation itself is unaffected if the module is disabled, since indexing is fully decoupled.

## Open Questions

- None blocking; backfill strategy and update/delete sync are deferred to follow-up changes as scoped in the proposal.
