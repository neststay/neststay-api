## Why

Users need a way to bookmark properties they're interested in for later, using a single toggle action from the client (e.g. tapping a heart icon) rather than separate add/remove endpoints. There is currently no relationship between users and properties beyond host ownership.

## What Changes

- Add `POST /properties/:slug/favourite` — authenticated endpoint, no request body. Resolves the property from `:slug` (404 if not found), resolves the user from the JWT, then toggles favourite status: creates a favourite record if none exists, removes it if one does.
- Add new `FavouriteProperty` Prisma model / `favourite_property` table: BigInt autoincrement `id` (PK), `userId`, `propertyId`, `createdAt` only, `@@unique([userId, propertyId])`, cascading deletes on both foreign keys.
- Response follows the existing envelope (`{ success, message, data }`) with `data: { slug, isFavourite }` and a `message` reflecting which way the toggle landed.

## Capabilities

### New Capabilities
- `property-favourites`: authenticated toggle endpoint allowing a user to favourite/unfavourite a property by slug, backed by a join table between users and properties.

### Modified Capabilities
(none — no existing capability's requirements change; this only adds new behavior)

## Impact

- **Database**: new `favourite_property` table and Prisma model, with FKs to `users` and `properties` (cascade delete).
- **API**: new route on the existing property module, `src/property/` (`PropertyController` gains an endpoint, or a sibling `favourite/` folder is added following the `image/` sub-module pattern — decided in design.md).
- **No breaking changes** to existing endpoints or response shapes.
