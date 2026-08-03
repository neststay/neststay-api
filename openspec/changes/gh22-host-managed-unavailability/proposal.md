## Why

Hosts currently have no way to block off dates on their own property for maintenance or personal use — `property_unavailability` rows can only be created indirectly via a guest booking (GH-21). Hosts need a direct way to manage their property's calendar independent of bookings.

## What Changes

- Add `POST /properties/:slug/unavailability` — host creates a `property_unavailability` row with `source: 'host_block'` and `bookingId: null` for a given date range. Subject to the same GiST exclusion constraint as booking-created rows, so overlapping an existing booking or block is rejected.
- Add `DELETE /properties/:slug/unavailability/:id` — host removes a `host_block` row. Rejects (does not silently no-op) any attempt to delete a `booking`-sourced row, since that would desync a confirmed booking from the calendar.
- Both endpoints enforce ownership: only the property's host may manage its unavailability, following the existing `getOwnedPropertyOrThrow` pattern used elsewhere in the property module.

## Capabilities

### New Capabilities
- `host-unavailability-management`: Lets a property's host create and delete manual `host_block` unavailability rows on their own property, independent of guest bookings.

### Modified Capabilities
(none — `property-availability` and `booking-creation` requirements are unchanged; this change only adds host-initiated writes to the same `property_unavailability` table)

## Impact

- **Code**: new endpoints/DTOs/service/repository methods in `src/booking` (or a new host-facing module alongside it) covering create and delete of `property_unavailability` rows.
- **Database**: no schema changes — reuses the `property_unavailability` table and GiST exclusion constraint added in GH-19.
- **APIs**: two new authenticated host-only routes under `/properties/:slug/unavailability`.
- **Out of scope**: any booking-side logic (GH-19/20/21 are unaffected).
