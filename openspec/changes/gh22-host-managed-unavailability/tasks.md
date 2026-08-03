> Every commit must reference `(GH-22)`.

## 1. Shared prep

- [ ] 1.1 Extract the Postgres exclusion-violation detector (`23P01` check) out of `src/booking/booking.repository.ts` into a shared helper (e.g. `src/prisma/postgres-errors.util.ts`), and update `booking.repository.ts` to import it (GH-22)
- [ ] 1.2 Create `src/property/unavailability/` submodule skeleton and register its controller/service/repository in `PropertyModule` (`src/property/property.module.ts`), following the existing `favourite`/`image` submodule pattern (GH-22)
- [ ] 1.3 Add `UnavailabilityConflictError` domain error class alongside the new repository (GH-22)

## 2. Create host block — `POST /properties/:slug/unavailability`

- [ ] 2.1 Add create-block request DTO (`startDate`, `endDate`) and response DTO (id, propertyId, startDate, endDate, source) (GH-22)
- [ ] 2.2 Add repository method: insert a `property_unavailability` row with `source: 'host_block'`, `bookingId: null`; catch the shared exclusion-violation error and translate to `UnavailabilityConflictError` (GH-22)
- [ ] 2.3 Add service method: resolve the property by slug, enforce ownership (host must match, else `404` — mirror `getOwnedPropertyOrThrow`), call the repository (GH-22)
- [ ] 2.4 Add `POST /properties/:slug/unavailability` controller endpoint (authenticated host), mapping `UnavailabilityConflictError` to `409 Conflict` (GH-22)
- [ ] 2.5 Add repository/service/controller tests covering: successful block, overlapping-block conflict, overlapping-booking conflict, and non-owning host gets `404` (GH-22)

## 3. Delete host block — `DELETE /properties/:slug/unavailability/:id`

- [ ] 3.1 Add repository method: look up a `property_unavailability` row scoped to both `id` and the resolved `propertyId`; delete only if `source === 'host_block'` (GH-22)
- [ ] 3.2 Add service method: resolve the property by slug, enforce ownership (`404` on mismatch), fetch the row scoped to the property (`404` if missing/not on this property), reject with `UnavailabilityConflictError` if `source === 'booking'`, otherwise delete (GH-22)
- [ ] 3.3 Add `DELETE /properties/:slug/unavailability/:id` controller endpoint (authenticated host), mapping `UnavailabilityConflictError` to `409 Conflict` (GH-22)
- [ ] 3.4 Add repository/service/controller tests covering: successful delete of a `host_block` row, rejected delete of a `booking`-sourced row, `404` for a row on another property, and non-owning host gets `404` (GH-22)

## 4. Verification

- [ ] 4.1 Manually verify both endpoints end-to-end (e.g. via Bruno collection or curl): create a block, confirm the property shows unavailable for those dates, attempt an overlapping block and confirm `409`, attempt to delete a booking-sourced row and confirm `409`, delete a host block and confirm the property becomes available again (GH-22)
- [ ] 4.2 Run lint, typecheck, and the full test suite (GH-22)
