## Context

`GET /properties` currently has no guard and no way to identify the caller. `FavouriteProperty` (userId, propertyId, unique pair) already exists from gh9. The listing repository method (`findAllPaginatedByLocation`) already embeds `images` via a Prisma `include`, per the architecture rule to load related data at the repository level rather than per-item client calls. This change follows the same pattern for the favourite state, and adds the auth piece needed to know *which* user (if any) is asking.

## Goals / Non-Goals

**Goals:**
- `GET /properties` returns `isFavourited` per item, correct for both authenticated and anonymous callers.
- No N+1 queries: the favourite check is batched into the same paginated query via Prisma `include`.
- The route remains fully public — no behavior change for anonymous callers beyond the new field.

**Non-Goals:**
- No change to the favourite toggle or favourites-list endpoints (gh9, gh10).
- No global "optional auth" rollout — only `GET /properties` adopts the new guard in this change.
- No schema/migration changes.

## Decisions

### 1. `OptionalJwtAuthGuard` extends `AuthGuard('jwt')` and overrides `handleRequest`
Standard Nest/Passport pattern: reuse the existing `JwtStrategy` (token verification + slug→id lookup) as-is, but override `handleRequest(err, user)` to return `user ?? null` instead of throwing when `err` is set or `user` is falsy. `@UseGuards(OptionalJwtAuthGuard)` on `GET /properties` means `request.user` is populated when a valid token is present and `undefined` otherwise — the route never rejects.

Alternative considered: parse/verify the token manually in the controller or service. Rejected — it would duplicate `JwtStrategy.validate()`'s user-lookup logic and bypass the existing guard/decorator composition (`@UseGuards` + `@CurrentUser()`), which the rest of the codebase relies on.

### 2. `@CurrentUser()` cannot be reused as-is for the optional case
`@CurrentUser()` assumes `request.user.userId` exists and returns a `bigint`. For `GET /properties`, the id is optional. Add a second decorator, `@CurrentUserOptional()`, returning `request.user?.userId ?? null` (`bigint | null`), rather than changing `@CurrentUser()`'s contract and risking a silent `undefined` on the routes that require auth.

### 3. Repository: extend the existing `include`, not a second query
`findAllPaginatedByLocation` gains an optional `userId: bigint | null` param. When present, the Prisma `include` adds `favourites: { where: { userId } }` (selecting only `id`, per the architecture rule to strip identity fields from embedded relations — actually `favourites` is filtered to at most one row per property per user, so the presence/absence of that array element is enough; no fields need to be read). Prisma batches this as one extra query for the whole page, same shape as the `images` include — not N+1.

### 4. Service maps `favourites.length > 0` → `isFavourited`, then strips `favourites` from the DTO
`toResponseDto` computes `isFavourited: (property.favourites ?? []).length > 0` and does not copy the raw `favourites` array onto `PropertyResponseDto` — only the derived boolean is exposed, consistent with the "strip identity fields from embedded relations" rule (the caller has no legitimate use for the favourite record's own id).

## Risks / Trade-offs

- [Risk] A second guard (`OptionalJwtAuthGuard`) plus a second `@CurrentUser`-style decorator adds a small amount of surface area. → Mitigation: both are thin wrappers around existing, already-tested `JwtStrategy`/`JwtAuthGuard` machinery; no new verification logic.
- [Risk] Forgetting to filter the `favourites` include by `userId` would leak whether *other* users favourited a property. → Mitigation: the Prisma `where: { userId }` filter is mandatory whenever `userId` is non-null, and covered by a controller/service test asserting `isFavourited` differs per requesting user.

## Migration Plan

No data migration. Deploy is a single release: guard, decorator, repository/service/controller changes, and DTO field all land together. No rollback concerns beyond a standard revert — `isFavourited` is additive to the response shape.
