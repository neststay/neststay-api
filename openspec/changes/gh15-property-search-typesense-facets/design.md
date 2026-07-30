## Context

`gh14-index-properties-typesense` stands up the `search` module, a Typesense client provider, and an idempotently-created `properties` collection (fields: `id`, `slug`, `name`, `description`, `nightlyRate`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`, `locationId`, `locationName`, `placeTypeId`, `placeTypeName`, `imageUrls`, `createdAt`), populated asynchronously whenever a property is created. This change adds the read side: a public search endpoint over that collection, plus a `search_history` log.

Per `docs/architecture/index.md`: repositories never leave their owning module, controllers only call services, and public-facing rows get a `slug` (ulid) alongside a BigInt `id`. Per `docs/architecture/event-driven-architecture.md`: events model side effects (email, analytics, downstream jobs) fired after a service's primary write — they are not the mechanism for the primary write itself.

`GET /properties` (gh13) already established the optional-auth pattern this endpoint reuses: `OptionalJwtAuthGuard` + `@CurrentUserOptional()` returning `bigint | null`.

## Goals / Non-Goals

**Goals:**

- Provide `GET /search`, a query-param-driven full-text search over the Typesense `properties` collection, returning results and facet counts.
- Support both guest and authenticated callers via the existing optional-auth pattern.
- Log every search (query text, requesting user or null) to a new `search_history` table with a client-visible unique id, without depending on or blocking the search response.
- Keep the module boundary intact: `search_history`'s repository lives in `search`, not `property`.

**Non-Goals:**

- Storing search results or click/conversion events against a `search_history` row (explicit future work — this change only reserves `searchId` as the id that future conversion tracking would key off).
- Any relevance/ranking tuning beyond Typesense's defaults.
- Admin/analytics reporting over `search_history`.
- Changing `gh14`'s indexing pipeline (already amended, during exploration, to include `imageUrls`).

## Decisions

**1. `search_history` write is synchronous, in-request — not event/queue-driven.**
`docs/architecture/event-driven-architecture.md` frames events as modeling _side effects_ that happen after a service's primary write (email, analytics, enqueued jobs), and explicitly says not to add an event unless it's actually needed for that purpose. Recording that a search happened is not a side effect of `GET /search` — it _is_ one of the two things the request does (search Typesense, log the search). So `SearchQueryService` calls `SearchHistoryRepository.create(...)` directly, no `EventEmitter2`/BullMQ involved. This can be revisited later if history-writing needs to be decoupled (e.g. once result/click data makes the write heavier), but nothing here forecloses that.

**2. The Typesense search and the `search_history` write run concurrently; only the Typesense call's failure fails the request.**
The `searchId` is generated in-memory (`ulid()`) before either call, so neither depends on the other's output. `SearchQueryService` fires both concurrently (e.g. `Promise.allSettled`), then: if the Typesense promise rejected, rethrow that error (search is the primary purpose of the endpoint — a guest/user issuing a search expects results or a clear failure). If the `search_history` write's promise rejected, log it and continue — the client still gets `searchId` in the response even though, in this failure case, no row exists yet for it. This trades perfect `searchId`-to-row correctness under DB failure for never letting a transient history-logging error block search results, which was an explicit product decision (search must keep working even if logging hiccups).

**3. `search_history` schema keeps `userId` nullable and stores only the raw query text — no filters, no results.**
`userId: bigint | null` mirrors `Property.hostId` being non-nullable but this being the opposite case: guests are a first-class caller of `GET /search` (same as `GET /properties`), so `null` is a normal value, not an error state. Only the free-text `query` is stored, not the facet filter params (`locationId`, `numberOfGuests`, etc.) — the ticket asks for "the string that was actually searched," and adding filter capture now would be speculative given results/conversions aren't being stored yet either. If filter capture turns out to matter for the eventual "attach results" work, it's an additive column, not a breaking change.

**4. `search_history.searchId` (ulid) is the id returned to the client as `searchId`, generated the same way `Property.slug` is.**
Follows the existing convention (`ulid()` called in the repository's `create`, e.g. `property.repository.ts:73`) rather than inventing a new id scheme, but names the column `searchId` (not `slug`) since this row isn't addressed by a slug-based lookup route the way `Property` is — it's purely the token returned to the client for click/conversion correlation. This keeps the "public-facing rows get an opaque public id" rule consistent while naming the column for what it actually represents.

**5. Search results are a lean DTO built directly from Typesense hits — no per-item Postgres hydration.**
`docs/architecture/index.md` requires embedding related data at the repository level rather than one extra call per list item; the same principle applies here even though the "repository" is Typesense rather than Prisma. Since the `properties` Typesense document (post gh14-amendment) already carries every field needed for a result card — including `imageUrls` — there is no need to re-fetch each hit from Postgres via `PropertyService.getBySlug`. This keeps `GET /search` to exactly two round-trips total (Typesense + one `search_history` insert) regardless of page size, instead of `1 + N` Postgres lookups for `N` results.

**6. Facet filters map to Typesense `filter_by`; the same fields are requested via `facet_by`.**
Query params (`locationName`, `placeTypeName`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`, `minNightlyRate`/`maxNightlyRate`) are all optional and additive — omitted params impose no filter. Location and place type are filtered by their name (not id): both `locationName` and `placeTypeName` are `facet: true` fields on the `properties` collection, and using the name keeps the filter param and the corresponding facet count consistent with each other (a client picks a facet count entry and re-supplies that same value as the filter, without needing a separate id lookup). `facet_by` is fixed to `locationName,placeTypeName,numberOfGuests,numberOfBedrooms,numberOfBathrooms` so the response always includes facet counts for those dimensions regardless of which filters the caller applied, letting the client render "narrow further" UI.

**7. `GET /search` is a new top-level route, not nested under `/properties`.**
gh14's proposal already frames "search/query API endpoints against Typesense" as belonging to the `search` capability, distinct from `property-management`. `/search` avoids implying these results are literally `PropertyController`'s resource (they're a different shape — no `isFavourited`, no full `images` objects, no `host`) and keeps the `search` module's controller colocated with its own service/repository, consistent with "controllers only call services [in their own module]."

## Risks / Trade-offs

- **[Risk]** A `search_history` write failure means `searchId` returned to the client has no backing row — a later click-conversion write against that id would silently have nothing to attach to. → **Mitigation**: accepted per decision 2; this is a deliberate trade favoring search availability over logging completeness. If this becomes a problem, the future "attach results/clicks" work can validate `searchId` existence and treat a miss as a no-op.
- **[Risk]** Lean, Typesense-doc-only results (decision 5) mean any field added to `PropertyResponseDto` later (e.g. `isFavourited`) won't automatically appear in search results — the two DTOs will drift. → **Mitigation**: accepted; search results are intentionally a distinct, lighter shape. If parity becomes a requirement, that's a follow-up change, not scope creep here.
- **[Risk]** This change cannot be deployed or tested end-to-end until `gh14-index-properties-typesense` is implemented (currently 0/32 tasks complete) — the `properties` collection and `search` module scaffolding it depends on don't exist yet. → **Mitigation**: explicit dependency called out in the proposal; `tasks.md` for this change assumes gh14's module layout (`search.module.ts`, Typesense client provider) already exists.

## Migration Plan

1. Confirm `gh14-index-properties-typesense` is applied (Typesense client, `search` module, `properties` collection with `imageUrls`).
2. Add `SearchHistory` model to `prisma/schema.prisma`, generate and run the migration.
3. Add `SearchHistoryRepository` (owns all `search_history` queries) to `src/search/`.
4. Add DTOs (`SearchQueryDto`/`SearchQuerySchema`, `SearchResultDto`, paginated response wrapper) to `src/search/dto/`.
5. Add `SearchQueryService` (Typesense query + concurrent history write) and `SearchController` (`GET /search`, `OptionalJwtAuthGuard`) to `src/search/`.
6. Register the new repository/service/controller in `search.module.ts`.

No rollback concerns beyond a standard revert — this change is additive (new table, new endpoint) and does not modify gh14's indexing pipeline or any existing endpoint.

## Open Questions

- None blocking; filter capture in `search_history` and results/click persistence are deferred to future work as noted in Goals/Non-Goals.
