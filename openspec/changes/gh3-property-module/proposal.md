## Why

Hosts currently have no way to list bookable properties. The API needs a `Property` entity plus CRUD and location-scoped listing so the rest of the platform (search, booking) has something to build on.

## What Changes

- Add a new `Property` Prisma model (table `properties`) with a `BigInt` primary key kept strictly internal, and a ulid-based `slug` column that is the only identifier ever exposed via the API.
- Add slim `Location` and `PlaceType` Prisma models — minimal reference tables that exist so `Property.locationId` and `Property.placeTypeId` can be real, DB-enforced foreign keys.
- Add a real DB-level foreign key from `Property.hostId` to `users.id` (a "host" is just a `User`; no separate `Host` model).
- Add a new `property` module (controller, service, repository, DTOs) following the existing `user` module's structure and conventions.
- Add five services: create, get-by-slug, update-by-slug, delete-by-slug, and list-by-location (paginated).

## Capabilities

### New Capabilities
- `property-management`: create, read (single + paginated list scoped to a location), update, and delete operations for properties, addressed publicly by slug rather than internal id.

### Modified Capabilities
(none — no existing capability's requirements change)

## Impact

- **Database**: three new tables — `properties`, `locations`, `place_types` — plus a new FK constraint on `properties.hostId` referencing `users.id`. New Prisma migration required.
- **API surface**: new `/properties` routes (exact paths defined in design.md).
- **Code**: new `src/property/` module mirroring `src/user/`; no changes to existing modules beyond the new FK reference to `users`.
- **Out of scope** (tracked separately, not blocking this change): adding a `role` field to `User` (#1), adding a `slug`/bigint PK to `User` (#2). Ownership/auth checks in this change therefore cannot depend on user roles.
