## Why

Hosts currently have no way to take a property out of circulation without deleting it — e.g. when a host's subscription lapses or they want to pause bookings for an extended period. We need an active/inactive status so a property can be hidden from all discovery surfaces (listing, favourites, search) while its data and history are preserved, and toggled back on later.

## What Changes

- Add an `isActive` boolean column to `Property` (default `true`).
- `GET /properties` (list by location) and `GET /properties/favourites` filter to `isActive: true` only.
- `GET /properties/:slug` (direct detail lookup) is **not** filtered — it remains reachable and its response includes `isActive` so callers can render an "unavailable" state, rather than 404ing.
- Add two host-only endpoints: `POST /properties/:slug/activate` and `POST /properties/:slug/deactivate`, each scoped to properties the caller owns (same ownership semantics as update/delete — non-owner attempts look identical to a non-existent slug).
- Activation/deactivation each emit a dedicated domain event (`property.activated`, `property.deactivated`) carrying the property's `slug`.
- The search module's Typesense document gains an `isActive` field; both new events feed the existing reindex pipeline (same producer/queue/processor used for `property.created`) so status changes are reflected in Typesense without a full reindex.
- `GET /search` always excludes inactive properties, enforced server-side in the Typesense filter — not exposed as a client-controllable filter param.

## Capabilities

### New Capabilities
(none — this extends existing property/search capabilities)

### Modified Capabilities
- `property-management`: adds `isActive` to the property model, activate/deactivate endpoints, list-by-location filtering, and detail-lookup behavior for inactive properties.
- `property-favourites`: the favourites list excludes properties that are currently inactive.
- `property-search-indexing`: indexed documents carry `isActive`; two new listeners (`property.activated`, `property.deactivated`) enqueue reindexing via the existing producer/processor.
- `property-search-query`: search results always exclude inactive properties, enforced server-side.

## Impact

- Prisma schema + migration: `is_active` column on `Property`, no index for now.
- `src/property`: repository (list/favourite queries add `isActive: true`), service (activate/deactivate methods + event emission), controller (two new routes), response DTO (`isActive` field).
- `src/property/favourite`: repository query adds `isActive: true` filter on the joined property.
- `src/search`: Typesense schema + `PropertyDocument` type gain `isActive`; `PropertyIndexProcessor.toDocument()` maps it; two new event listeners reuse `SearchProducerService.enqueuePropertyIndex`; `TypesenseSearchClient.buildFilterBy` always appends `isActive:=true`, independent of caller-supplied filters.
