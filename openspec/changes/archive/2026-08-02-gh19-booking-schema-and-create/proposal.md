## Why

Guests currently have no way to reserve a property for specific dates, and the platform has no data model for tracking which dates a property is taken. This change lays the booking foundation: the schema that represents bookings and date-level unavailability, plus the two APIs that make it usable end-to-end — checking whether a property is free for a date range, and creating a booking. Without this foundation, none of the later booking-epic work (host-managed blocks, listing/viewing bookings) has anything to build on.

This change combines GitHub issues #19 (schema), #20 (availability check), and #21 (create booking) into a single OpenSpec change because the two APIs both read and write the same `property_unavailability` table the schema introduces, and shipping them together avoids an intermediate state where the schema exists but nothing exercises it.

## What Changes

- Add `Booking` model (`bookings` table): guest, property, date range, price snapshot, stubbed payment status, public-facing `slug` reference (nanoid-based, not ulid).
- Add `PropertyUnavailability` model (`property_unavailability` table): the single derived calendar of taken dates per property, sourced either from a booking or (in a future change) a host-created block.
- Add a Postgres GiST exclusion constraint on `property_unavailability` (via raw-SQL migration, requires `btree_gist`) that makes overlapping date ranges for the same property impossible to insert, independent of application logic.
- Add `GET /properties/:slug/availability` — checks whether a property is free for a given date range.
- Add `POST /bookings` — creates a booking; inserts the `bookings` row and its corresponding `property_unavailability` row in one transaction, and returns a clean conflict error if the requested dates are already taken.

## Capabilities

### New Capabilities
- `property-availability`: querying whether a property is available for a given date range.
- `booking-creation`: a guest reserving a property for a date range, producing a booking record and consuming those dates from the property's availability.

### Modified Capabilities
None — no existing spec's requirements change.

## Impact

- **Database**: two new tables (`bookings`, `property_unavailability`), one new Postgres extension (`btree_gist`), one new exclusion constraint. New Prisma models and a hand-edited raw-SQL migration.
- **API**: two new endpoints (`GET /properties/:slug/availability`, `POST /bookings`) under a new `booking` module (repository, service, controller, DTOs), following existing property module conventions.
- **Out of scope for this change**: booking cancellation, real payment processing, host-managed unavailability blocks (GH-22), listing/viewing bookings (GH-23).
