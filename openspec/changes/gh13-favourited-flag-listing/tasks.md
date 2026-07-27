## 1. Optional auth guard

- [x] 1.1 Add `OptionalJwtAuthGuard` in `src/auth/guards/optional-jwt-auth.guard.ts`, extending `AuthGuard('jwt')` and overriding `handleRequest` to return `user ?? null` instead of throwing.
- [x] 1.2 Add `@CurrentUserOptional()` decorator in `src/auth/decorators/current-user-optional.decorator.ts`, returning `request.user?.userId ?? null`.
- [x] 1.3 Register `OptionalJwtAuthGuard` as a provider/export in `src/auth/auth.module.ts` alongside `JwtAuthGuard`.

## 2. Repository

- [x] 2.1 Extend `PropertyRepository.findAllPaginatedByLocation` to accept an optional `userId: bigint | null` and add `favourites: { where: { userId } }` to the Prisma `include` when `userId` is non-null.
- [x] 2.2 Update the `PropertyWithImages` type (or add a new type) to reflect the optional `favourites` relation on the returned model.

## 3. Service

- [x] 3.1 Thread the optional `userId` through `PropertyService.listByLocation` into the repository call.
- [x] 3.2 In `toResponseDto`, compute `isFavourited: (property.favourites ?? []).length > 0` and do not copy the raw `favourites` array onto the DTO.

## 4. DTO

- [x] 4.1 Add `isFavourited: boolean` to `PropertyResponseDto` (`src/property/dto/property-response.dto.ts`), including Swagger `@ApiProperty` metadata consistent with existing fields.

## 5. Controller

- [ ] 5.1 Apply `@UseGuards(OptionalJwtAuthGuard)` to `GET /properties` in `property.controller.ts`.
- [ ] 5.2 Read the optional current user via `@CurrentUserOptional()` and pass it into `propertyService.listByLocation`.

## 6. Tests

- [ ] 6.1 Unit test `OptionalJwtAuthGuard`/`handleRequest` for: valid token, missing token, invalid/expired token — request proceeds in all cases, `request.user` set only for the valid case.
- [ ] 6.2 Service/repository test: `isFavourited` is `true` only for properties favourited by the given `userId`, `false` for others and for `userId: null`.
- [ ] 6.3 Controller integration test: authenticated request with favourites returns correct per-property `isFavourited`; anonymous request returns `isFavourited: false` for all items; two different authenticated users see independent favourite state for the same property.
