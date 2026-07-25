## Context

`User.id` is a `String @id` populated with a ulid generated in application code (`ulid()` in `user.repository.ts`). It is used directly as:
- the JWT `sub` claim (`user.service.ts` `login()`),
- the public identifier returned in login/register/list responses,
- the FK target for `Property.hostId` and `FavouriteProperty.userId` (both `String`).

`docs/architecture/index.md` establishes the standard: all models get a `BigInt` primary key; public-facing models additionally get a ulid `slug` column that clients use to address the resource. `Property` already follows this (`id BigInt @id @default(autoincrement())`, `slug String @unique`, with `PropertyRepository.findBySlug`, `getBySlug`/`updateBySlug`/`deleteBySlug` in the service, and `:slug` route params in the controller). `User` needs the same treatment.

We are still in development with no production data, so this is being treated as a destructive schema change (reset migrations, wipe dev DB, reseed) rather than a live data migration.

## Goals / Non-Goals

**Goals:**
- Bring `User` in line with the `BigInt` id + `slug` architecture standard.
- Never expose the internal bigint id to clients — only `slug`.
- Keep `hostId`/`userId` FK columns as bigint, matching `User.id`'s new type.
- Preserve existing route shapes (`POST /users/login`, `POST /users/register`, `GET /users`) — only the `id` field in responses changes to `slug`.

**Non-Goals:**
- No data migration script for existing rows — the dev database is reset.
- No new public routes for fetching a single user by slug (`GET /users/:slug`) — out of scope unless a future ticket asks for it. `findBySlug` is added at the repository/service layer for internal consistency and to replace the currently-unused id-based methods, not to add a new endpoint.
- No change to `Property`/`Image`/`Favourite` business logic — only the type of `hostId`/`userId` propagates from `string` to `bigint`.

## Decisions

**1. JWT `sub` carries the bigint id as a string, not the slug.**
`hostId`/`userId` are used internally for ownership checks and FK writes (`Property.hostId`, `FavouriteProperty.userId`), which are bigint columns. Putting the slug in the JWT would require a slug→id lookup on every authenticated request. Putting the raw bigint in the JWT is not possible because JWT payloads are JSON, and `JSON.stringify` throws on `bigint`. So: `sub` is `user.id.toString()` at sign time (`user.service.ts` `login()`), and `jwt.strategy.ts` `validate()` parses it back via `BigInt(sub)` before attaching to `request.user`. `CurrentUser()`'s return type changes from `string` to `bigint` accordingly.
- Alternative considered: put `slug` in the JWT and resolve to internal id via a DB lookup on every request. Rejected — adds a query to every authenticated request for no benefit, since the id is only ever used internally.

**2. `findById`/`update`/`delete` on `UserService`/`UserRepository` become slug-based.**
These three methods currently take `id: string` but are not called from any controller route today (dead code). Rather than retyping them to `bigint` (internal id) and leaving them dead, they're converted to `findBySlug`/`updateBySlug`/`deleteBySlug`, mirroring the `Property` pattern, so that if/when a `GET /users/:slug`-style route is added later it slots in directly.
- Alternative considered: delete the unused methods entirely. Rejected — keeping them (as slug-based) costs little and pre-empts near-certain future need (profile view/edit), consistent with the existing `Property` shape.

**3. Response DTOs (`LoginResponseDto`, `RegisterResponseDto`, `UserResponseDto`, `PaginatedUserListDto`) replace `id: string` with `slug: string`.**
The internal bigint id is never serialized into any client-facing response. This matches the architecture rule that embedded/returned identity should be the public slug, not the internal id.

**4. Migrations: reset rather than incrementally alter.**
Since there is no data to preserve, the simplest and clearest path is to delete the existing migration history and generate one fresh baseline migration reflecting the final schema (bigint `User.id`, `User.slug`, bigint `Property.hostId`, bigint `FavouriteProperty.userId`), then `prisma migrate reset` against the dev database. This avoids writing throwaway `ALTER COLUMN ... USING id::bigint`-style migration SQL for data that won't exist.
- Alternative considered: add an incremental migration on top of history that drops and recreates the affected columns. Rejected — adds noise to migration history for a case where a clean baseline is available and correctness of a real data migration doesn't need to be proven here.

**5. BigInt/JSON serialization boundary is handled explicitly at each crossing point, not globally.**
Rather than adding a global BigInt JSON serializer (e.g. patching `BigInt.prototype.toJSON`), each place a bigint id crosses a serialization boundary gets an explicit conversion:
- JWT signing: `sub: user.id.toString()`.
- BullMQ job payload: `UserRegisterJobPayload.userId` stays `string`; `user-register-queue.listener.ts` converts `payload.id.toString()` when building the job.
- No response DTO ever carries a raw bigint (per Decision 3), so no conversion is needed there.
- Alternative considered: monkey-patch `BigInt.prototype.toJSON` globally so any accidental bigint in a response silently serializes as a string. Rejected — it would silently mask exactly the mistake we want to prevent (leaking an internal id), and the architecture rule requires slug, not stringified-id, in responses anyway.

**6. `app.controller.ts` `/profile` endpoint.**
Currently returns `{ userId }` straight from `@CurrentUser()`. Once `CurrentUser()` returns `bigint`, this becomes `{ userId: bigint }`, which will throw on `JSON.stringify` at the Express layer. This endpoint is a debug/ad-hoc route, not a documented API surface (no DTO, no Swagger decorators). It will be updated to return `{ userId: userId.toString() }` to keep it functional, without expanding its scope into a real profile endpoint.

## Risks / Trade-offs

- [Risk] Any missed bigint→string conversion at a serialization boundary throws at runtime (`TypeError: Do not know how to serialize a BigInt`) rather than failing a type check, since these boundaries (JWT sign, BullMQ payload) aren't statically typed against `bigint` vs `string` in a way TypeScript enforces end-to-end. → Mitigation: the task list enumerates every such boundary explicitly (JWT sign, queue listener, `/profile`); e2e/manual verification of login and register flows after implementation should specifically exercise these.
- [Risk] Resetting migration history changes the shape of `prisma/migrations/` that other branches/environments may depend on. → Mitigation: acceptable per explicit user confirmation that dev DB destruction is fine; no shared/staging environment depends on this history yet.
- [Trade-off] Keeping `findBySlug`/`updateBySlug`/`deleteBySlug` on `UserService` even though no route calls them yet is speculative work beyond the ticket's literal ask. Justified here only because it mirrors an established, already-reviewed pattern (`Property`) rather than inventing new shape — low cost, keeps modules consistent.

## Open Questions

- Should `/profile` be upgraded to return the full user shape (email, slug, etc.) via `UserResponseDto` instead of a bare `userId`, now that we're touching this code anyway? Left as-is (just fixed to not crash) unless the user wants to fold that in.
