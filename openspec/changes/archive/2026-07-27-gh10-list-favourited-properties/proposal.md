## Why

Users can already toggle a property in and out of their favourites (#9), but there is no way to retrieve that list, so a client cannot build a "My Favourites" screen.

## What Changes

- Add `GET /properties/favourites`, an authenticated endpoint that returns the current user's favourited properties.
- User identity comes from the JWT (`@CurrentUser()`), not a route/query param.
- Response is paginated using the existing `page`/`limit` query convention and the `PaginatedResponseDto` envelope, with each item shaped as `PropertyResponseDto`.
- Results are ordered by `favourite_property.createdAt` descending (most recently favourited first).
- Users with no favourites get a `200` with an empty `items` array, not an error.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `property-favourites`: adds a requirement for listing a user's favourited properties via `GET /properties/favourites`, in addition to the existing toggle requirement.

## Impact

- `src/property/favourite/`: new DTO, repository method, service method, and controller route.
- `src/property/favourite/favourite.repository.ts`: new paginated query joining `favourite_property` to `property`, filtered by `userId`.
- `openspec/specs/property-favourites/spec.md`: gains a new requirement for the list endpoint.
- No schema changes — reuses the existing `FavouriteProperty` model from #9.
