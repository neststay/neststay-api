## 1. Prisma schema and migration

- [x] 1.1 Add `Location` model to `prisma/schema.prisma` (`BigInt @id @default(autoincrement())`, minimal fields, `@@map("locations")`)
- [x] 1.2 Add `PlaceType` model to `prisma/schema.prisma` (`BigInt @id @default(autoincrement())`, minimal fields, `@@map("place_types")`)
- [x] 1.3 Add `Property` model to `prisma/schema.prisma`: `BigInt @id @default(autoincrement())` internal id, unique `slug` (`String`), `hostId` (`String`, FK to `User.id`), `locationId` (`BigInt`, FK to `Location.id`), `placeTypeId` (`BigInt`, FK to `PlaceType.id`), `nightlyRate` (`Decimal`), `name`, `description`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`, timestamps, `@@map("properties")`
- [x] 1.4 Add the `host`/`properties` back-relation on `User` needed for the `hostId` FK
- [x] 1.5 Run `prisma migrate dev` to generate and apply the migration creating `locations`, `place_types`, `properties` tables
- [x] 1.6 Run `prisma generate` to regenerate the Prisma client models used by the repository

## 2. Property module scaffolding

- [x] 2.1 Create `src/property/` module files mirroring `src/user/`: `property.module.ts`, `property.controller.ts`, `property.service.ts`, `property.repository.ts`
- [x] 2.2 Register `PropertyModule` in `src/app.module.ts`

## 3. DTOs and validation schemas

- [ ] 3.1 Create `create-property.dto.ts` + zod `CreatePropertySchema` (locationId, placeTypeId, nightlyRate, name, description, numberOfGuests, numberOfBedrooms, numberOfBathrooms — no hostId, no slug)
- [ ] 3.2 Create `update-property.dto.ts` + zod `UpdatePropertySchema` (same fields as create, all optional)
- [ ] 3.3 Create `property-response.dto.ts` exposing only `slug` (never `id`) plus all public property fields
- [ ] 3.4 Create `paginated-property-list.dto.ts` extending `PaginatedResponseDto<PropertyResponseDto>`, mirroring `paginated-user-list.dto.ts`
- [ ] 3.5 Create `list-property-query.dto.ts` + zod `ListPropertyQuerySchema` (required `locationId`, plus `page`/`limit` reusing pagination conventions)

## 4. Repository

- [ ] 4.1 Implement `property.repository.ts`: `create`, `findBySlug`, `findByIdAndHostId` (for ownership-scoped update/delete), `updateBySlug`/`update`, `delete`, `findAllPaginatedByLocation` (using `prisma-extension-pagination`, same pattern as `UserRepository.findAllPaginated`)
- [ ] 4.2 Generate `slug` with `ulid()` on create, following `UserRepository.create`'s id-generation pattern

## 5. Service layer

- [ ] 5.1 Implement `create` service method: takes DTO + authenticated `hostId`, persists via repository, returns `PropertyResponseDto`
- [ ] 5.2 Implement `getBySlug` service method: throws `NotFoundException` if not found, returns `PropertyResponseDto`
- [ ] 5.3 Implement `updateBySlug` service method: loads property by slug, throws `NotFoundException` if missing OR `hostId` doesn't match authenticated user (identical error in both cases), applies update, returns `PropertyResponseDto`
- [ ] 5.4 Implement `deleteBySlug` service method: same ownership check as update (404 for both missing and non-owner), then deletes
- [ ] 5.5 Implement `listByLocation` service method: paginated, requires `locationId`, returns `PaginatedResponseDto<PropertyResponseDto>` via `mapToPaginatedResponse`
- [ ] 5.6 Implement private `toDto` mapper converting the Prisma `Decimal` `nightlyRate` to a plain type and omitting internal `id`/`locationId`/`placeTypeId`/`hostId` FK ids as needed by the response DTO

## 6. Controller and routes

- [ ] 6.1 `POST /properties` — behind `JwtAuthGuard`, `@CurrentUser()` for `hostId`, validate body with `CreatePropertySchema`, 422 on invalid payload, 201 on success
- [ ] 6.2 `GET /properties/:slug` — public, no guard, 404 via service when not found
- [ ] 6.3 `GET /properties` — public, no guard, validate query with `ListPropertyQuerySchema`, 422 when `locationId` missing/invalid
- [ ] 6.4 `PATCH /properties/:slug` — behind `JwtAuthGuard`, `@CurrentUser()` passed to service for ownership check, validate body with `UpdatePropertySchema`
- [ ] 6.5 `DELETE /properties/:slug` — behind `JwtAuthGuard`, `@CurrentUser()` passed to service for ownership check
- [ ] 6.6 Add Swagger decorators (`@ApiOperation`, `@ApiEnvelopeResponse`, `@ApiHttpErrorResponse`, `@ApiBearerAuth` where guarded) to every route, mirroring `user.controller.ts`

## 7. Seed data (unblocks manual testing)

- [ ] 7.1 Add a minimal `Location` and `PlaceType` seed row to `prisma/seed.ts` so property creation is testable end-to-end
