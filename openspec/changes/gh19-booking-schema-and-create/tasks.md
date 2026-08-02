> Each task below is tagged with the GitHub issue it belongs to — GH-19 (schema), GH-20 (availability check), or GH-21 (create booking). When implementing, every commit must reference the specific ticket number for the task it completes (matching this repo's existing convention, e.g. `0d1e269 feat: add GET /search controller and route (GH-15)`). Do not default every commit to `(GH-19)` — a commit for a task under section 2 uses `(GH-20)`, a commit for section 3 uses `(GH-21)`, etc.

## 1. Schema & migration (GH-19)

- [x] 1.1 Add `Booking` and `PropertyUnavailability` models to `prisma/schema.prisma`, following existing singular-model/plural-`@@map` conventions (GH-19)
- [x] 1.2 Run `prisma migrate dev --create-only` to generate the base migration (GH-19)
- [x] 1.3 Hand-edit the generated `migration.sql`: add `CREATE EXTENSION IF NOT EXISTS btree_gist;` and the GiST exclusion constraint on `property_unavailability` (GH-19)
- [x] 1.4 Apply the migration locally; manually verify the constraint rejects an inserted overlapping row before writing application code against the table (GH-19)

## 2. Property availability check (GH-20)

- [ ] 2.1 Add availability query DTO (`startDate`, `endDate`) and response DTO (GH-20)
- [ ] 2.2 Add repository method on the booking module's repository: overlap query against `property_unavailability` for a property, using exclusive-checkout date semantics (GH-20)
- [ ] 2.3 Add service method that resolves the property by slug and calls the repository (GH-20)
- [ ] 2.4 Add `GET /properties/:slug/availability` controller endpoint (GH-20)
- [ ] 2.5 Add repository/service tests covering: available, overlapping, and back-to-back (exclusive checkout) cases (GH-20)

## 3. Create booking (GH-21)

- [ ] 3.1 Add create-booking request DTO and booking response DTO (including `slug`) (GH-21)
- [ ] 3.2 Add `nanoid` dependency; add slug generator (custom alphabet, length 8) alongside the repository, following the existing inline `ulid()`-before-insert pattern (GH-21)
- [ ] 3.3 Add repository method: single Prisma `$transaction` inserting the `bookings` row and its linked `property_unavailability` row (`source: 'booking'`) (GH-21)
- [ ] 3.4 Handle the Postgres exclusion-violation error (code `23P01`) from the transaction in the repository/service boundary and translate it into a domain conflict error (GH-21)
- [ ] 3.5 Add service method: resolve property by slug, snapshot `nightlyRate`/compute `totalAmount`, set `paymentStatus: 'done'`, call repository, map conflict error to `409 Conflict` (GH-21)
- [ ] 3.6 Add `POST /bookings` controller endpoint (authenticated guest) (GH-21)
- [ ] 3.7 Add repository/service/controller tests covering: successful booking, rejected overlapping booking, and price-snapshot behavior (GH-21)

## 4. Verification

- [ ] 4.1 Manually verify both endpoints end-to-end (e.g. via Bruno collection or curl): check availability, create a booking, re-check availability now shows unavailable, attempt an overlapping booking and confirm `409` (GH-20, GH-21)
- [ ] 4.2 Run lint, typecheck, and the full test suite
