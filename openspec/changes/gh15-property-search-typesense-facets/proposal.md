## Why

Properties are indexed into Typesense by `gh14-index-properties-typesense`, but there is no way for a client to actually search them yet — gh14 explicitly scoped a read-side search API out as a follow-up. This change adds that follow-up: a public, query-param-driven search endpoint over the Typesense `properties` collection, returning results plus facets, and logging each search so future conversion tracking (search → click) has an anchor to attach to.

**Dependency**: This change requires `gh14-index-properties-typesense` to be implemented and deployed first — the Typesense `properties` collection and its `imageUrls` field (added to gh14 during exploration for this change) must exist and be populated before this API can query it.

## What Changes

- New `GET /search` endpoint (top-level resource, not nested under `/properties`) accepting `q` (search text, required) plus optional facet filters (`locationId`, `placeTypeId`, `minNightlyRate`/`maxNightlyRate`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`) and `page`/`limit`, guarded by the existing `OptionalJwtAuthGuard` so both guests and logged-in users can search.
- Endpoint queries the Typesense `properties` collection (`query_by` on `name`/`description`, `filter_by` built from the supplied facet filters, `facet_by` on `locationId`, `placeTypeId`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`) and returns a lean, Typesense-doc-shaped result list (no per-item Postgres hydration) plus facet counts.
- New `search_history` Postgres table and Prisma model, owned by the `search` module: `id` (BigInt PK), `searchId` (unique ulid — the public search id), `userId` (nullable — null for guest searches), `query` (the raw searched text), `createdAt`. Each search request generates a `searchId` up front and writes one row.
- The Typesense query and the `search_history` write run concurrently; a Typesense failure fails the request, a `search_history` write failure is caught/logged and does not affect the response.
- The response includes the generated `searchId` (the `search_history` row's `searchId`), so a client can later attribute a click/conversion back to this search.
- Out of scope for this change: persisting search results or click/conversion events (`search_history` is query-only for now), ranking/relevance tuning beyond Typesense defaults, and any admin/analytics view over `search_history`.

## Capabilities

### New Capabilities

- `property-search-query`: Query-param-driven full-text search over the Typesense `properties` collection, returning results and facet counts, with optional auth.
- `search-history-logging`: Recording each search query (guest or authenticated) to a `search_history` table with a generated public id, decoupled from the search response's success/failure.

### Modified Capabilities

- None. This change does not alter `property-management` or `property-search-indexing` (gh14) requirements.

## Impact

- **New files/modules**: `src/search/dto/search-query.dto.ts`, `src/search/dto/search-result.dto.ts`, `src/search/search-history.repository.ts`, `src/search/search-query.service.ts` (or extends existing `search` module service), `src/search/search.controller.ts`.
- **Modified files**: `prisma/schema.prisma` (new `SearchHistory` model), `src/search/search.module.ts` (register controller, repository, new provider), a new Prisma migration.
- **Dependencies**: none new (reuses `typesense` client and `OptionalJwtAuthGuard`/`@CurrentUserOptional()` already introduced by gh14 and gh13).
- **Depends on**: `gh14-index-properties-typesense` must be applied first (Typesense client, `properties` collection with `imageUrls`, `search` module scaffolding).
