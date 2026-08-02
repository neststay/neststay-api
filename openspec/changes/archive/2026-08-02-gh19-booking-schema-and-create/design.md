## Context

The property module (`src/property/`) is the closest existing analogue: singular Prisma models with plural `@@map` tables, BigInt primary keys, `slug` + repository/service/controller layering, DTOs on every boundary (see `docs/architecture/index.md`). Booking introduces the first two tables in this codebase that need a concurrency-safe uniqueness guarantee that isn't a simple column-level `@@unique` — two overlapping date ranges for the same property must be mutually exclusive, which Prisma's schema DSL cannot express.

`docs/architecture/event-driven-architecture.md` governs side effects (email, analytics, queues) but explicitly states events should only be added "if instructed by the operator (do not automatically add it)." No side effect (confirmation email, notification, etc.) was requested for booking creation, so this design deliberately emits no event — that's a Non-Goal below, not an oversight.

## Goals / Non-Goals

**Goals:**
- Model `bookings` and `property_unavailability` so that `property_unavailability` is the single source of truth for "is this property free on date X."
- Make double-booking structurally impossible under concurrent writes, not just unlikely.
- Ship `GET /properties/:slug/availability` and `POST /bookings` end to end (DTO → repository → service → controller), following existing property-module conventions.
- Keep the public booking identifier short enough to serve as a guest-facing confirmation code.

**Non-Goals:**
- Booking cancellation (any actor) — future, admin-only ticket.
- Real payment processing — `paymentStatus` is a stub string set to `'done'` on creation.
- Host-managed unavailability blocks (GH-22) — schema supports it (`source: 'host_block'`) but no API is built here.
- Listing/viewing bookings (GH-23).
- Event emission for booking creation — not requested; per `event-driven-architecture.md`, events are opt-in, not automatic.

## Decisions

### `property_unavailability` is the single calendar; `bookings` is the record of who/why
Every confirmed booking writes exactly one `property_unavailability` row (`source: 'booking'`, `bookingId` set). This means availability checks (GH-20) never need to query `bookings` at all — one table, one query shape, and it already generalizes to host blocks (GH-22) without a schema change. Alternative considered: compute availability by unioning `bookings` and `property_unavailability` at query time — rejected because it doubles query complexity everywhere availability is checked and makes "cancel a booking" ambiguous about which table to delete from.

### Double-booking prevented by a Postgres GiST exclusion constraint, not application logic
`property_unavailability` gets `EXCLUDE USING gist (property_id WITH =, daterange(start_date, end_date, '[)') WITH &&)`, requiring the `btree_gist` extension. This is added via hand-written SQL in the generated migration (`prisma migrate dev --create-only`, then edit `migration.sql`) since Prisma's schema DSL has no representation for exclusion constraints. Alternatives considered:
- App-level check-then-insert: rejected outright — classic TOCTOU race, two concurrent requests can both pass the check.
- `SERIALIZABLE` transaction with app-level retry: correct, but pushes retry logic and isolation-level reasoning into every write path that touches this table (including GH-22's host blocks later). The exclusion constraint gets the same guarantee for free at the database layer, with no retry logic needed anywhere.

Date overlap uses strict inequalities matching an exclusive checkout: a range `[start, end)` means checkout day and a new check-in on the same day do not conflict. This must be consistent between the exclusion constraint's `daterange(..., '[)')` bound type and any application-level overlap query in GH-20's availability check — both must express "checkout exclusive" the same way, or the availability endpoint could say "available" for a range the exclusion constraint would then reject.

### Booking creation is a single DB transaction across two tables
The service inserts the `bookings` row and its `property_unavailability` row inside one Prisma `$transaction`. The exclusion constraint fires on the `property_unavailability` insert; if it does, the whole transaction rolls back and no orphaned `bookings` row is left behind. The service catches the Postgres error (code `23P01`, `unique_violation`'s exclusion-constraint sibling) and translates it into an HTTP `409 Conflict` with a plain "these dates are unavailable" message — no raw Postgres error text reaches the client.

### Booking's public identifier is a nanoid, not a ulid
`docs/architecture/index.md` states public-facing models get a `slug` column using ulid. This change deviates: `Booking.slug` is generated with `nanoid`, custom alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (excludes `0/O/1/I/L`), length 8. Rationale: unlike `Property`/`User` slugs, which only need to be unguessable URL identifiers, a booking's slug doubles as a confirmation code a guest might read aloud or type manually — a 26-character ulid is unusable for that. The column is still named `slug` (not `code`/`reference`) to keep the existing `findBySlug` / `GET /bookings/:slug` / `dto.slug` pattern intact; only the generator differs. Collision handling follows the same precedent as `ulid()` elsewhere in this codebase (`property.repository.ts:84`, `user.repository.ts:44`): generate before insert, rely on keyspace size (32^8 ≈ 1.1 trillion) making collisions negligible, DB unique constraint as the safety net — no retry-on-collision loop is introduced.

### Price snapshot on the booking row
`nightlyRate` and `totalAmount` are copied from `Property.nightlyRate` at booking-creation time rather than joined live from `Property` on read. If a host changes their nightly rate later, past bookings must keep showing the price the guest actually agreed to.

## Risks / Trade-offs

- **[Risk]** The `btree_gist` extension and exclusion constraint live in a hand-written `migration.sql` edit, not the Prisma schema — future `prisma migrate dev` runs on this table won't "see" the constraint in the DSL, so a careless schema change could silently drop it on the next migration. → **Mitigation**: note the constraint's existence directly above the `PropertyUnavailability` model in `schema.prisma` as a comment, and confirm the constraint still exists (`\d property_unavailability` or an information_schema query) in the PR description whenever this table's migration is touched again.
- **[Risk]** Catching Postgres error code `23P01` in the service couples application error handling to a specific database error code. → **Mitigation**: isolate this check in the repository or a single narrow helper, not scattered across the service, so it's a one-place fix if the error surface changes.
- **[Risk]** `paymentStatus` as a free-form string with only `'done'` ever written is a deliberately thin stub; a future payment ticket will need to widen this into a real state machine. → **Mitigation**: none needed now — flagged here so the future payment ticket knows this column exists and is not itself the payment system.

## Migration Plan

1. `prisma migrate dev --create-only` to generate the base migration for `Booking` and `PropertyUnavailability`.
2. Hand-edit the generated `migration.sql` to add `CREATE EXTENSION IF NOT EXISTS btree_gist;` and the `EXCLUDE USING gist (...)` constraint after the `CREATE TABLE property_unavailability` statement.
3. Apply the migration locally, confirm the constraint exists and rejects a manually-inserted overlapping row before writing any application code against the table.
4. No rollback complexity beyond a standard `prisma migrate` down — no existing data to backfill, both tables are new.

## Open Questions

None outstanding — all prior open questions (unavailability/booking relationship, overlap-prevention mechanism, booking lifecycle, slug format, payment stub, cancellation ownership) were resolved during exploration before this proposal was written.
