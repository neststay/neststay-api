## Why

The property listing view (`GET /properties`) needs to show whether the current user has already favourited each property, so the client can render a filled/outlined heart without an extra per-item request. `FavouriteProperty` already tracks this relation (added in gh9-favourite-toggle-property), so this is purely a listing-response change plus the auth handling needed to identify an optional current user.

## What Changes

- Add `isFavourited: boolean` to each item in the `GET /properties` response, reflecting whether the requesting user has favourited that property.
- Anonymous (unauthenticated) requests to `GET /properties` continue to succeed and return `isFavourited: false` for every item — the route stays public.
- Introduce an optional-auth guard (`OptionalJwtAuthGuard`) that populates `request.user` when a valid bearer token is present, but never rejects the request when the token is absent or invalid. Applied to `GET /properties` in place of no guard.
- Extend `PropertyRepository.findAllPaginatedByLocation` to accept the current user's id and include a filtered `favourites` relation (mirroring the existing `images` include) so the check stays a single batched query rather than N+1.

## Capabilities

### New Capabilities
- `optional-jwt-auth-guard`: A guard that resolves `request.user` from a bearer token when present and valid, but allows the request through regardless — for routes that behave differently for authenticated vs. anonymous callers without requiring auth.

### Modified Capabilities
- `property-management`: "List properties for a location" now returns an `isFavourited` flag per property, computed against the requesting user when authenticated and `false` when anonymous.

## Impact

- `src/property/property.controller.ts`: swap `GET /properties` to use `OptionalJwtAuthGuard`, pass current user id (nullable) into the service.
- `src/property/property.service.ts`, `src/property/property.repository.ts`: thread an optional `userId` through `listByLocation` / `findAllPaginatedByLocation`; map the `favourites` relation to `isFavourited` in the response DTO.
- `src/property/dto/property-response.dto.ts`: add `isFavourited` field.
- `src/auth/guards/optional-jwt-auth.guard.ts` (new), reusing the existing `JwtStrategy`.
- No schema change — `FavouriteProperty` already exists.
