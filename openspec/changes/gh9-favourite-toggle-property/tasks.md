## 1. Schema

- [x] 1.1 Add `FavouriteProperty` model to `prisma/schema.prisma` (`favourite_property` table: BigInt autoincrement `id`, `userId`, `propertyId`, `createdAt` only, `@@unique([userId, propertyId])`, `onDelete: Cascade` on both FKs)
- [x] 1.2 Add back-reference relation fields (`favouriteProperties FavouriteProperty[]`) to `User` and `Property` models
- [x] 1.3 Generate and run the Prisma migration for the new table

## 2. Favourite module scaffolding

- [x] 2.1 Create `src/property/favourite/` folder mirroring the `image/` sub-module layout
- [x] 2.2 Create `favourite-response.dto.ts` for the `{ slug, isFavourite }` response shape

## 3. Repository

- [x] 3.1 Implement `FavouriteRepository.findByUserAndProperty(userId, propertyId)`
- [x] 3.2 Implement `FavouriteRepository.create(userId, propertyId)`
- [x] 3.3 Implement `FavouriteRepository.delete(id)`
- [x] 3.4 Add `favourite.repository.spec.ts` covering find/create/delete against the test database, matching the style of `image.repository.spec.ts`

## 4. Service

- [x] 4.1 Implement `FavouriteService.toggle(slug, userId)`: resolve property via `PropertyService.getIdBySlug(slug)`, then find/create-or-delete via `FavouriteRepository`, returning `{ slug, isFavourite }`

## 5. Controller

- [x] 5.1 Implement `FavouriteController` at `properties/:slug/favourite` with `POST` toggle endpoint, `JwtAuthGuard`, `@CurrentUser()`, and the standard `ResponseApiDto` envelope
- [x] 5.2 Add Swagger decorators (`@ApiOperation`, `@ApiEnvelopeResponse` for 200, `@ApiHttpErrorResponse` for 401 and 404)

## 6. Module wiring

- [ ] 6.1 Register `FavouriteController`, `FavouriteService`, `FavouriteRepository` in the property module (following how `ImageController`/`ImageService`/`ImageRepository` are registered)

## 7. Verification

- [ ] 7.1 Manually verify the full toggle flow (favourite → unfavourite → favourite) against a running instance
- [ ] 7.2 Verify 404 on an unknown slug and 401 on a missing/invalid token
- [ ] 7.3 Run the full test suite and linter
