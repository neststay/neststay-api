## Why

`User.id` is currently a ulid string used directly as the primary key, exposed as-is in API responses (login, register, user list) and as the JWT `sub` claim. The architecture standard (`docs/architecture/index.md`) requires all models to use a `BigInt` primary key, with a separate ulid `slug` column for any model that is public-facing — a pattern already implemented for `Property`. `User` predates that standard and needs to be brought in line before more modules build on top of it.

## What Changes

- **BREAKING**: `User.id` changes from `String` (ulid) to `BigInt` (auto-increment). A new `User.slug` (ulid, unique) column becomes the public-facing identifier.
- **BREAKING**: `Property.hostId` and `FavouriteProperty.userId` (both FKs to `User.id`) change from `String` to `BigInt`.
- **BREAKING**: JWT `sub` claim now carries the internal bigint id (as a string, since JWT payloads must be JSON-serializable) instead of the ulid. `CurrentUser()` now yields a `bigint`.
- **BREAKING**: Login, register, and user-list responses expose `slug` instead of `id`. The internal bigint id is never returned to clients.
- Dev-only refactor: the local/dev database will be wiped and migrations reset rather than writing a data migration, since there is no production data to preserve yet.
- `UserRepository`/`UserService` gain slug-based lookups (`findBySlug`, etc.), mirroring `PropertyRepository.findBySlug`, replacing the currently-unused id-based `findById`/`update`/`delete`.
- Seed script and the one existing spec touching a ulid `userId` (`favourite.repository.spec.ts`) are updated to match the new bigint type.

## Capabilities

### New Capabilities

(none — this change only modifies existing capabilities)

### Modified Capabilities

- `user-management`: internal user model uses a bigint PK plus a ulid `slug` column; ULID generation moves from `id` to `slug`; repository/service gain slug-based lookup/update/delete in place of id-based ones.
- `user-login`: login response returns `slug` instead of `id`; JWT `sub` carries the bigint id (serialized as a string).
- `user-registration`: register response returns `slug` instead of `id`; the BullMQ job payload's `userId` is explicitly the internal id serialized as a string.
- `jwt-auth-guard`: `@CurrentUser()` now returns the parsed bigint id instead of the raw string `sub` claim.
- `database-seeding`: seed script generates `slug` (ulid) instead of `id` for the admin and fake users; `id` is left to the database.

Note: `property-management`, `property-images`, `property-favourites`, and `user-list` all consume `hostId`/`userId` (now `bigint` instead of `string`) but none of their spec-level requirements describe a type or behavior change — this is purely an internal type propagation with no observable difference, so no delta spec is needed for them (see Impact for the affected files).

## Impact

- **Schema**: `prisma/schema.prisma` (`User`, `Property.hostId`, `FavouriteProperty.userId`) and a reset migration history.
- **Auth**: `src/auth/strategies/jwt.strategy.ts`, `src/auth/decorators/current-user.decorator.ts`.
- **User module**: `src/user/user.repository.ts`, `src/user/user.service.ts`, `src/user/user.controller.ts`, all `src/user/dto/*.ts` response DTOs.
- **Property/Image/Favourite modules**: `hostId`/`userId` type propagation only, no new logic — `src/property/*.ts`, `src/property/image/*.ts`, `src/property/favourite/*.ts`.
- **Queue**: `src/queue/queue.types.ts`, `src/queue/processors/user-register.processor.ts`, `src/user/listeners/user-register-queue.listener.ts` — bigint id must be converted to string before entering the BullMQ/Redis-backed job payload (BigInt is not JSON-serializable).
- **Seed/tests**: `prisma/seed.ts`, `src/property/favourite/favourite.repository.spec.ts`.
- No production data migration required (dev DB reset).
