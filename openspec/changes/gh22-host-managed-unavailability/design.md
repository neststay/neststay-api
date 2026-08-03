## Context

`property_unavailability` and its GiST exclusion constraint were introduced in GH-19 for the guest-booking flow (GH-20/21). That work lives entirely in `src/booking`: `BookingRepository` queries and writes `property_unavailability` rows, and `BookingUnavailableError` maps a Postgres exclusion-violation (`23P01`) to a `409 Conflict` at the booking service boundary.

This change adds a second, independent writer of the same table: the property's host, blocking/unblocking dates outside of any booking. Per the ticket, booking-side logic is explicitly out of scope, so this should not require touching `src/booking`.

The property module already has a matching shape for this: `favourite` and `image` are host/guest-facing submodules nested under `src/property/`, each with their own controller/service/repository, all registered directly in the flat `PropertyModule`. `PropertyService.getOwnedPropertyOrThrow(slug, hostId)` (private, `src/property/property.service.ts:133`) is the existing ownership-check pattern: resolve by slug, compare `hostId`, and return `404` (not `403`) on mismatch so property existence isn't leaked to non-owners.

## Goals / Non-Goals

**Goals:**
- Let a host create a `host_block` row and delete their own `host_block` rows via `/properties/:slug/unavailability`.
- Reuse the existing GiST exclusion constraint for conflict detection on create — no new constraint or pre-check logic.
- Reject deletion of `booking`-sourced rows explicitly, rather than silently no-op-ing.
- Enforce host ownership using the same pattern already established for property management.

**Non-Goals:**
- Any change to booking creation, cancellation, or availability-check behavior (GH-19/20/21 stay untouched).
- Editing/updating an existing `host_block` row's dates (out of scope; a host re-blocks by deleting and re-creating).
- Bulk block operations (multiple ranges in one call).

## Decisions

**1. New submodule `src/property/unavailability/`, registered in `PropertyModule` — not added to `src/booking`.**
Mirrors the existing `favourite`/`image` submodule pattern (own controller/service/repository/dto, no separate Nest module, wired into the flat `PropertyModule`). This keeps the change entirely off `BookingModule`, matching the ticket's "out of scope: booking-side logic," and lets the service reach property ownership data directly via the already-in-module `PropertyRepository` instead of an inter-module dependency.
- *Alternative considered*: add host-block methods to `BookingRepository`/`BookingModule`. Rejected — would couple a booking-flow module to host-management logic the ticket explicitly separates, and would need `BookingModule` to depend on `PropertyRepository` internals it doesn't currently need.

**2. New repository queries `property_unavailability` directly (Prisma), separate from `BookingRepository`.**
Two repositories legitimately writing the same table is fine here — they serve different callers (guest booking transaction vs. host direct management) with different validation rules (a host can only touch `host_block` rows; a guest booking never touches existing rows directly). Follows "queries belong in repositories, repositories stay in their module."

**3. Extract the Postgres exclusion-violation detector (`23P01` check) into a small shared helper instead of duplicating it.**
`isExclusionViolation` in `booking.repository.ts:16` is copy-paste-able but non-trivial (reaches into `PrismaClientKnownRequestError.meta.driverAdapterError`). With a second real caller, duplicating it verbatim is worse than sharing it. Move it to `src/prisma/postgres-errors.util.ts` (or similar shared prisma-adjacent location) and update `booking.repository.ts` to import it.
- *Alternative considered*: duplicate the check locally in the new repository. Rejected given it's the exact same non-trivial logic with a second identical use site now.

**4. New `UnavailabilityConflictError` domain error, distinct from `BookingUnavailableError`.**
Reusing `BookingUnavailableError` for a host-block conflict would be a misleading name leaking a booking-domain concept into host management. The new error is thrown by the unavailability repository on `23P01` (create) and by the service when a delete targets a `booking`-sourced row (application-level check, no DB error involved). Both cases map to `409 Conflict` at the controller/service boundary, consistent with the existing booking-conflict convention.

**5. Ownership check duplicates the `getOwnedPropertyOrThrow` pattern locally rather than exposing it from `PropertyService`.**
The new service resolves the property by slug via the module-local `PropertyRepository` and compares `hostId` itself, returning `404` on mismatch — same behavior as `property.service.ts`, small enough (~5 lines) that promoting it to a shared/public method isn't warranted yet.
- *Alternative considered*: make `getOwnedPropertyOrThrow` public on `PropertyService` and call it from the new service. Rejected for now — `PropertyService` isn't otherwise a dependency of this submodule, and the duplication is minimal; revisit if a third consumer needs it.

**6. `DELETE /properties/:slug/unavailability/:id` scoping and error shape.**
The repository lookup filters by both `id` and `propertyId` (via the resolved slug) so an id belonging to a different property returns `404`, not `409` or `403` — consistent with not leaking cross-property row existence. If the row is found but `source !== 'host_block'`, the service throws `UnavailabilityConflictError` → `409 Conflict` (the row exists and is visible to this host, but the operation is refused because deleting it would desync a confirmed booking).

## Risks / Trade-offs

- **[Risk]** Two repositories (booking, unavailability) both write `property_unavailability`; a future schema change to that table now has two call sites to update. → **Mitigation**: the shared exclusion-violation helper (Decision 3) is the one piece of real shared logic; the rest (distinct queries per caller) is intentionally separate and low-risk to diverge.
- **[Risk]** No pre-flight availability check before insert on the create-block path (same as GH-21's booking create) means a conflicting create relies on the DB throwing `23P01`. → **Mitigation**: this matches the already-shipped GH-21 pattern, so behavior is consistent across both writers; a pre-check could be added later to both if a friendlier error is wanted, but that's out of scope here.
