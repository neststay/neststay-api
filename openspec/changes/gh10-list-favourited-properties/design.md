## Context

`FavouriteController` currently only exposes `POST /properties/:slug/favourite` (toggle), scoped under `@Controller('properties/:slug/favourite')`. `PropertyController` exposes `GET /properties/:slug` as a catch-all read route. Adding `GET /properties/favourites` as a new, differently-shaped route (`/properties/<literal>` vs `/properties/:slug`) into the same `PropertyModule` risks being shadowed by the existing `GET /properties/:slug` handler, since NestJS (via the underlying Express adapter) registers and matches routes in the order controllers/methods are declared — it does not automatically prioritize a static segment over a dynamic one declared earlier.

`FavouriteRepository`/`FavouriteService` already own all `favourite_property` data access (per `queries should be inside repositories` and `controllers should always call services`), so the new capability should reuse that layer rather than duplicating query logic elsewhere.

## Goals / Non-Goals

**Goals:**
- Add `GET /properties/favourites` returning the authenticated user's favourited properties, paginated, ordered by most-recently-favourited first.
- Reuse the existing pagination envelope (`PaginatedResponseDto`/`PaginationMetaDto`) and `PropertyResponseDto` item shape so clients get the same contract as `GET /properties`.
- Guarantee `/properties/favourites` is never shadowed by `GET /properties/:slug`.

**Non-Goals:**
- No changes to the toggle endpoint (`POST /properties/:slug/favourite`) or its behavior.
- No new database schema — reuses the `FavouriteProperty` model and its cascade behavior from #9.
- No filtering/sorting options beyond `page`/`limit` (matches the ticket's scope).

## Decisions

**1. Route lives on `PropertyController`, declared before `findBySlug`, and delegates to `FavouriteService`.**
Add `@Get('favourites')` to `PropertyController` as a new method placed immediately before the existing `@Get(':slug')` method, injecting `FavouriteService`. Within a single controller class, Nest registers routes in method-declaration order, so `favourites` is guaranteed to match before `:slug` regardless of any future reordering of the module's `controllers` array. `PropertyController` still only calls a service (`FavouriteService.listForUser`), matching the existing controller → service → repository layering.
- *Alternative considered*: a new dedicated controller (e.g. `FavouriteListController` at `@Controller('properties')`) registered before `PropertyController` in `PropertyModule`'s `controllers` array. Rejected: correctness would depend on array ordering in a file unrelated to this change, which is easy to silently break later (e.g. someone reorders controllers or extracts `PropertyController` into its own sub-module import). Keeping the route and its ordering guarantee inside one class file is more robust.

**2. Reuse `PropertyService`'s Property → `PropertyResponseDto` mapping.**
Make `PropertyService`'s private `toDto` method public (renamed `toResponseDto`) so `FavouriteService.listForUser` can map each favourited `Property` the same way `PropertyService.listByLocation` does, instead of duplicating the mapping (slug, images, timestamps, etc.) in the favourite module.
- *Alternative considered*: duplicate a mapper inside `favourite/`. Rejected: two mappers for the same DTO would drift as `PropertyResponseDto` evolves.

**3. Query and paginate from the `favourite_property` side, not `property`.**
`FavouriteRepository` gets a new method, e.g. `findPaginatedByUser({ userId, page, limit })`, using `prisma.extendedClient.favouriteProperty.paginate({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { property: { include: { images: { orderBy: { order: 'asc' } } } } } }).withPages({ page, limit })`. Ordering must be by the favourite's own `createdAt` (most recently favourited first per the ticket), which is only available by paginating `favouriteProperty`, not `property`.

**4. New request query DTO, reuse existing response DTO.**
Add a `FavouriteListQueryDto`/`FavouriteListQuerySchema` (zod) mirroring `ListPropertyQueryDto` but without `locationId` — just optional `page`/`limit` (default 1 / 10, max 50), validated in the controller the same way `ListPropertyQuerySchema` is validated in `findAll`. No new response DTO is needed: the shape is identical to the existing `PaginatedPropertyListDto` (`PaginatedResponseDto<PropertyResponseDto>`), so it's reused directly.

## Risks / Trade-offs

- **[Risk]** A future edit could still reintroduce a route-shadowing bug if `favourites` is moved after `:slug` in `PropertyController`, or if `:slug` is changed to a wildcard matcher. → **Mitigation**: cover this with an e2e/integration test asserting `GET /properties/favourites` does not 404/reach the `findBySlug` handler, so a regression fails CI rather than surfacing in production.
- **[Trade-off]** Placing a favourites-listing route on `PropertyController` (rather than fully isolating all favourite-related HTTP surface in `favourite/`) slightly blurs module boundaries in exchange for routing safety. Acceptable since the controller method body is a one-line delegation to `FavouriteService`.

## Open Questions

None — ticket scope and existing conventions (`GET /properties` pagination, `PaginatedResponseDto`) fully determine the shape of this endpoint.
