## Context

The property module (`src/property/`) currently has no concept of a relationship between a `User` and a `Property` other than ownership (`hostId`). This change introduces the first many-to-many relationship in the schema: any authenticated user can favourite any property, regardless of who hosts it.

The module already has a precedent for a property-scoped sub-resource: `src/property/image/` implements its own `Controller`/`Service`/`Repository` mounted at `properties/:slug/images`, calling into `PropertyService` to resolve the property rather than querying `PropertyRepository` directly (per the architecture rule that repositories stay private to their own module). Image mutations use `PropertyService.getOwnedPropertyIdBySlug(slug, hostId)` because only the host may mutate images. Favouriting is different: it is not an ownership-gated action, so it must resolve the property via the existing non-owner-scoped `PropertyService.getIdBySlug(slug)` instead.

## Goals / Non-Goals

**Goals:**
- Let any authenticated user toggle favourite status on any existing property by slug.
- Keep the toggle race-safe: a duplicate favourite for the same (user, property) must never be possible.
- Match existing architectural conventions exactly (module layering, DTO/response envelope, BigInt PK, camelCase FKs, Prisma model/table naming).

**Non-Goals:**
- No endpoint to list a user's favourited properties (a future capability, not part of this change).
- No embedding of `isFavourite` or favourite counts into `GET /properties` / `GET /properties/:slug` responses — that is a separate read-path change and is left as an open question below.
- No host-only restriction — any authenticated user, including a host favouriting their own listing, is allowed.

## Decisions

**1. New `favourite/` sub-module under `src/property/`, mirroring `image/`.**
`FavouriteController` mounts at `properties/:slug/favourite`, with its own `FavouriteService` and `FavouriteRepository`. This matches the existing pattern exactly (one sub-resource folder per relation) rather than bolting new methods onto `PropertyController`/`PropertyService`, keeping `PropertyController` focused on the property resource itself.
- Alternative considered: add the endpoint directly to `PropertyController`/`PropertyService`. Rejected because it would mix an unrelated concern (favouriting) into the core property CRUD service, and diverges from the `image/` precedent already established for property sub-resources.

**2. Resolve the property via `PropertyService.getIdBySlug(slug)`, not `getOwnedPropertyIdBySlug`.**
Favouriting is a viewer action, not an ownership action — `getIdBySlug` already exists on `PropertyService` and throws `NotFoundException` on a missing slug, which gives the required 404 behavior for free with no new code on `PropertyService`.

**3. Toggle logic: read-then-act, not insert-and-catch.**
`FavouriteService.toggle(slug, userId)` calls `PropertyService.getIdBySlug(slug)`, then `FavouriteRepository.findByUserAndProperty(userId, propertyId)`. If found, delete and return `isFavourite: false`; if not found, create and return `isFavourite: true`. This matches the simple, readable repository style already used throughout the codebase (e.g. `getOwnedPropertyOrThrow` then act). The `@@unique([userId, propertyId])` constraint is the actual safety net against a race between two concurrent toggles from the same user — a narrow window exists between the read and the write, but the unique constraint guarantees the database never ends up with duplicate favourite rows even if both requests reach the "create" branch.
- Alternative considered: create-and-catch-unique-violation-then-delete. Rejected as unnecessary complexity for a low-contention action (a single user double-tapping their own favourite button), and it isn't a pattern used anywhere else in this codebase.

**4. `FavouriteProperty` model — `createdAt` only, cascading FKs, BigInt PK.**
```prisma
model FavouriteProperty {
  id         BigInt   @id @default(autoincrement())
  userId     String
  propertyId BigInt
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@unique([userId, propertyId])
  @@map("favourite_property")
}
```
- BigInt PK matches the architecture rule that all models use BigInt primary keys; no slug column, since this table is never addressed directly by clients (it's only ever reached indirectly via the property slug + the current user).
- `createdAt` only, no `updatedAt` — a row is only ever created or deleted, never mutated in place, so `updatedAt` would never change and would be dead weight.
- `onDelete: Cascade` on both FKs matches the `Image` → `Property` precedent: if a property or a user is deleted, their favourite rows should not become orphaned.
- `@@unique([userId, propertyId])` is what makes the toggle safe (see Decision 3) and also prevents duplicate favourite rows from ever existing.

**5. Response shape: `{ slug, isFavourite }`, message reflects the branch taken.**
```json
{
  "success": true,
  "message": "Property added to favourites",
  "data": { "slug": "abc123", "isFavourite": true }
}
```
Echoing `slug` (which the client already has from the URL) rather than any internal id keeps the response consistent with how the rest of the property module avoids leaking internal ids in embedded/response shapes.

## Risks / Trade-offs

- **[Risk]** A toggle endpoint is not idempotent — a retried request (e.g. due to a network blip) flips state twice instead of leaving it unchanged. → **Mitigation**: none needed for this change; this is an accepted trade-off of the toggle UX explicitly requested, and the risk is limited to a single user's own favourite state (no data corruption, worst case is a UI toggle looking "off by one" until the user retaps).
- **[Risk]** Any authenticated user can favourite any property, including ones that no longer make sense to favourite (e.g. none currently — there's no soft-delete/archival state on `Property` to worry about). → **Mitigation**: none needed now; revisit if `Property` gains an archived/unlisted state later.
- **[Trade-off]** Favourite status/count is not embedded into property read responses in this change, even though `docs/architecture/index.md` calls out "favourite counts" as an example of data that should be embedded via relation rather than fetched separately. → Deliberately deferred: this change only covers the toggle write path per the proposal's scope; embedding read-side favourite data into `PropertyResponseDto`/`PaginatedPropertyListDto` is left as an open question below rather than folded in silently.

## Migration Plan

- Add a Prisma migration for the new `favourite_property` table (additive only — no changes to existing tables/columns).
- No data backfill needed (new, empty table).
- No rollback complexity beyond dropping the table if reverted; no existing data depends on it.

## Open Questions

- Should a future change embed `isFavourite` (for the current viewer) or a favourite count into `GET /properties` and `GET /properties/:slug` responses, per the architecture guidance on embedding relations? Not addressed here — flagging for a follow-up change once a "list my favourites" need or a property-detail UX need makes it concrete.
