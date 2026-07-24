## Context

`docs/architecture/index.md` establishes the conventions this design follows: singular model names / plural table names, camelCase foreign keys, queries confined to repositories, only services injected/exported across modules, controllers never call repositories directly, and DTOs required on every request/response. `docs/architecture/index.md` has no linked sub-documents.

The only existing model is `User` (ulid string PK). This change introduces the first multi-table feature: `Property`, plus two small reference tables (`Location`, `PlaceType`) that exist solely to give `Property.locationId` / `Property.placeTypeId` real foreign keys. Neither `Location` nor `PlaceType` has any requested CRUD API — they are backing data only for this change. `User` currently has no role field (tracked separately in issue #1), so authorization here cannot key off roles.

## Goals / Non-Goals

**Goals:**
- A `property` module (controller/service/repository/DTOs) that mirrors the `user` module's structure exactly.
- `Property.id` (BigInt) never appears in any API request or response; `slug` is the only external identifier.
- All three foreign keys on `Property` (`hostId`, `locationId`, `placeTypeId`) are real, DB-enforced constraints.
- A host can only create/update/delete their own properties, without depending on a role system that doesn't exist yet.

**Non-Goals:**
- No CRUD API for `Location` or `PlaceType` in this change — they're seeded/managed some other way, TBD later.
- No role-based authorization (see issue #1) — ownership is enforced via a direct `hostId === authenticated user id` check instead.
- No change to `User`'s own PK/slug strategy (see issue #2) — `hostId` stays a `String` referencing the existing ulid `users.id`.

## Decisions

**1. `Location` / `PlaceType` use `BigInt` autoincrement PKs, no slug.**
Since neither has a public-facing endpoint in this change, there's no need to hide their PK behind a slug the way `Property` does. Making them `BigInt` also settles `Property.locationId` / `Property.placeTypeId` as `BigInt` columns with real FKs — consistent types on both sides of the constraint. Alternative considered: ulid `String` PKs to match `User`; rejected because it adds slug-shaped complexity with no consumer of it yet, and there's no requirement forcing consistency with `User`'s PK strategy.

**2. `nightlyRate` is `Decimal` (Prisma `Decimal` → Postgres `numeric(10,2)`).**
Money needs exact arithmetic; `Decimal` avoids float rounding errors without inventing a minor-units (cents) convention that nothing else in the codebase uses yet. Alternative considered: `Int` cents; rejected as premature — no other monetary field exists to establish that convention against, and `Decimal` is the more conventional Postgres/Prisma default.

**3. `slug` fully replaces `id` at the API boundary.**
`property.controller.ts` routes take `:slug`, all DTOs expose `slug` and never `id`. The repository still does internal lookups/joins by `id`; `findBySlug` is the only externally-reachable read path in the repository for single-record operations.

**4. Ownership enforced directly against `hostId`, not roles.**
`create`/`update`/`delete` sit behind `JwtAuthGuard`. On create, `hostId` is taken from the JWT `sub` claim (never from the request body) so a caller can't create a property on someone else's behalf. On update/delete, the service loads the property and throws `NotFoundException` (not `ForbiddenException`) if `hostId !== authenticated user id` — a non-owner gets the same 404 as a genuinely missing slug, so property existence and ownership are never revealed to a non-owner. `list` and `get-by-slug` are public, no guard. Alternative considered: gate mutations behind a `host` role; rejected — no role field exists yet (issue #1), and blocking this change on that one is unnecessary since a direct ownership check is strictly available today. Alternative considered: return 403 Forbidden for non-owners; rejected because it confirms the slug exists and belongs to someone else, leaking information an attacker could use to enumerate properties.

**5. `locationId` is a required query param on the list endpoint.**
The requested service is explicitly "list properties *for a given location*," not a general browse-all. Enforced via the same zod-schema-in-controller pattern used elsewhere (422 on a missing/invalid value).

## Risks / Trade-offs

- [`Location`/`PlaceType` have no CRUD API yet, so rows must be inserted manually/via seed for `Property` creation to work at all] → acceptable for this change since it's explicitly out of scope; flag as the natural next follow-up once real requirements for managing them exist.
- [Ownership check duplicated logic that a future role system will likely subsume] → isolate it in one place in `property.service.ts` so swapping to role-based checks later is a small, localized change.
- [`Decimal` requires care in TypeScript — Prisma returns a `Decimal` object, not a plain number] → convert explicitly to `string`/`number` in the response DTO mapping, same place `toDto` already exists in the `user` module pattern.

## Migration Plan

Single additive Prisma migration: create `locations`, `place_types`, `properties` tables and the FK from `properties.hostId` to `users.id`. No existing tables are altered. Fully reversible via `prisma migrate` down/rollback since nothing pre-existing changes shape.

## Open Questions

None outstanding — all items flagged in the proposal as needing an explicit decision are resolved above.
