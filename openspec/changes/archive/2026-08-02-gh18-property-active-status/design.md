## Context

Properties can currently only be created, updated, or deleted — there's no way to temporarily take one out of circulation (host subscription lapses, host pauses a listing) without destroying it. This change adds an `isActive` flag and wires it through every read path (list, favourites, search) plus a host-facing toggle.

The codebase already has a working event → queue → processor pipeline for search indexing (`PropertyCreatedListener` → `SearchProducerService` → `PropertyIndexProcessor`, see `docs/architecture/event-driven-architecture.md`). `PropertyIndexProcessor` always refetches the full property and re-upserts the entire Typesense document — it never does a partial field update. That means this change needs zero new queue/processor plumbing: adding `isActive` to the document shape and firing an existing-style event is sufficient to keep Typesense in sync.

## Goals / Non-Goals

**Goals:**
- A property can be marked active/inactive by its owning host.
- Inactive properties are excluded from every *discovery* surface: location listing, favourites list, search.
- Direct detail lookup by slug still works for inactive properties, but surfaces the status so the client can render "unavailable" messaging instead of a working booking page.
- Status changes propagate to Typesense via the existing event-driven reindex pipeline, with no new job type.

**Non-Goals:**
- No admin override — toggling is host-only for this change (no admin/role concept exists in the codebase yet; introducing one is out of scope).
- No reason/audit trail for why a property went inactive — flat boolean only, per explicit decision to keep the table simple. Revisit if/when an audit requirement shows up.
- No index on `is_active` yet — deferred until real listing/search query shapes are known.
- No change to booking/reservation flows for already-booked inactive properties — out of scope for this change.

## Decisions

**1. Boolean `isActive` column, not an enum.**
A boolean fully covers "active vs inactive" as scoped. An enum (`active`/`inactive`/`suspended`) was considered to capture *why* a property is down, but that's explicitly deferred — adding a reason later is an additive column change, not a rewrite, so there's no lock-in cost to starting simple.

**2. Detail lookup (`GET /properties/:slug`) is not filtered by `isActive`.**
Alternative considered: 404 for inactive properties, matching the ownership-hiding pattern used by update/delete. Rejected because a 404 is indistinguishable from "this property never existed," which is the wrong signal for e.g. a guest with a past booking looking up a property that's since gone inactive. Instead, `PropertyResponseDto` gains an `isActive` field so the client can distinguish "not found" from "found but currently unavailable."

**3. Listing and favourites are filtered; search is filtered server-side only.**
`findAllPaginatedByLocation` and the favourites query both add `isActive: true` to their Prisma `where`. For search, `TypesenseSearchClient.buildFilterBy` always appends `isActive:=true` to the constructed `filter_by` string — this is not part of `TypesenseSearchFilters` and is never derived from caller input, so there's no way for a client to request inactive results.

**4. Two dedicated events (`property.activated`, `property.deactivated`), not one `property.status_changed`.**
Matches the two dedicated endpoints (`POST .../activate`, `POST .../deactivate`) chosen over a single toggle-with-body endpoint. Both events carry only `{ slug }`, same minimal-payload shape as the existing `property.created` event, and today both route to the exact same `SearchProducerService.enqueuePropertyIndex` call. The split costs one extra constant + listener registration now, in exchange for each event being independently extensible later (e.g. deactivation someday also needing to touch pending bookings) without adding a payload flag to branch on.

**5. New listeners live in `src/search/listeners/`, following the existing `PropertyCreatedListener` precedent.**
`event-driven-architecture.md`'s general guidance is that listeners live in the module owning the *domain of the job* they enqueue — here that's search indexing, not property management, which is exactly where `PropertyCreatedListener` already sits. The two new listeners (or an expanded existing listener handling three events) follow that established placement rather than moving anything into `src/property`.

**6. No new job type or Typesense partial-update call.**
`PropertyIndexProcessor` already does a full slug-based refetch + upsert. Reusing `JOB_PROPERTY_INDEX` for activation/deactivation keeps the pipeline single-purpose ("resync this slug's document with the DB") rather than adding a second, narrower job type that would need to stay in sync with the first.

## Risks / Trade-offs

- **Eventual consistency window**: between a toggle and the queued reindex completing, Typesense may briefly still return/exclude a property incorrectly. This is the same window that already exists for `property.created` today, so it's an accepted, pre-existing trade-off of the architecture rather than a new risk.
- **Ownership leakage on toggle endpoints**: activate/deactivate must 404 (not 403) for non-owners, identical to update/delete, so a non-owner can't probe which slugs exist. Must be implemented via the same `getOwnedPropertyOrThrow` pattern.
- **Column addition on a live table**: `ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true` is a metadata-only change on Postgres 11+ (no full table rewrite/lock), so this is safe to ship without a maintenance window.

## Migration Plan

1. Add `isActive Boolean @default(true)` to the `Property` Prisma model; generate and run the migration (additive, backward-compatible — existing rows default to active, no backfill script needed).
2. Ship repository/service/controller changes and Typesense schema/document/query changes together, since the document shape and query filter must agree once any reindex happens.
3. No feature flag needed — this is purely additive (new column defaults to today's implicit behavior of "everything is active").
4. Rollback: revert the migration is safe since no other column depends on `isActive` yet; in-flight reindex jobs referencing the field would simply stop being produced once listeners are removed.

## Open Questions

None outstanding — scope, endpoint shape, event shape, and filtering behavior were all confirmed during exploration.
