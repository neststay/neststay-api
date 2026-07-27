## 1. Request/response DTOs

- [x] 1.1 Add `FavouriteListQueryDto` + `FavouriteListQuerySchema` (zod) in `src/property/favourite/dto/`, mirroring `ListPropertyQueryDto` but without `locationId` (`page` default 1, `limit` default 10, max 50)

## 2. Repository

- [x] 2.1 Add `FavouriteRepository.findPaginatedByUser({ userId, page, limit })` using `prisma.extendedClient.favouriteProperty.paginate(...).withPages(...)`, filtered by `userId`, `orderBy: { createdAt: 'desc' }`, `include: { property: { include: { images: { orderBy: { order: 'asc' } } } } }`
- [x] 2.2 Add/extend `favourite.repository.spec.ts` covering the new method (pagination args passed through, empty result set)

## 3. Service

- [x] 3.1 Rename `PropertyService`'s private `toDto` to public `toResponseDto` and update its internal callers
- [x] 3.2 Add `FavouriteService.listForUser({ userId, page, limit })` that calls `FavouriteRepository.findPaginatedByUser`, maps each result's `property` via `PropertyService.toResponseDto`, and returns a `PaginatedResponseDto<PropertyResponseDto>` via `mapToPaginatedResponse`

## 4. Controller

- [x] 4.1 Add `@Get('favourites')` to `PropertyController`, declared immediately before `findBySlug(':slug')`, guarded with `JwtAuthGuard`, validating query params with `FavouriteListQuerySchema` (same pattern as `findAll`)
- [x] 4.2 Inject `FavouriteService` into `PropertyController` and delegate to `favouriteService.listForUser`
- [x] 4.3 Add Swagger decorators (`@ApiOperation`, `@ApiBearerAuth`, `@ApiEnvelopeResponse(200, ..., PaginatedPropertyListDto)`, `@ApiHttpErrorResponse(401, ...)`) matching the conventions used elsewhere in the controller

## 5. Tests

- [x] 5.1 Add e2e/integration coverage: authenticated user with favourites gets them ordered by most-recently-favourited first; user with none gets an empty `items` array; unauthenticated request gets `401`; a user never sees another user's favourites
- [x] 5.2 Add a regression test asserting `GET /properties/favourites` reaches the favourites handler and not `GET /properties/:slug` with `slug="favourites"`
