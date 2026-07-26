## 1. Schema and migration

- [x] 1.1 Update `prisma/schema.prisma`: `User.id` -> `BigInt @id @default(autoincrement())`, add `User.slug String @unique`
- [x] 1.2 Update `prisma/schema.prisma`: `Property.hostId` -> `BigInt`
- [x] 1.3 Update `prisma/schema.prisma`: `FavouriteProperty.userId` -> `BigInt`
- [x] 1.4 Delete `prisma/migrations/*` (old migration history removed; fresh baseline migration still needs to be generated once the dev DB reset is approved)
- [x] 1.5 Run `prisma migrate reset` against the local dev database and regenerate the Prisma client (`npm run prisma:generate`)

## 2. Auth chain

- [x] 2.1 `src/auth/auth.module.ts`: import `UserModule` so `JwtStrategy` can inject `UserService`
- [x] 2.2 `src/auth/strategies/jwt.strategy.ts`: inject `UserService`; `validate()` looks up the user via `findBySlug({ slug: sub })`, throws `UnauthorizedException` if not found, and returns `{ userId: user.id }` (`bigint`) — `sub` itself is never parsed as a bigint, it is the slug
- [x] 2.3 `src/auth/decorators/current-user.decorator.ts`: change return type from `string` to `bigint`, update the `Request` user type accordingly
- [x] 2.4 `src/user/user.service.ts` `login()`: sign JWT with `sub: user.slug` (unchanged in shape from today — still a ulid string, just sourced from the new `slug` column instead of `id`)

## 3. User module

- [x] 3.1 `src/user/user.repository.ts`: `create()` stops setting `id: ulid()`, sets `slug: ulid()` instead
- [x] 3.2 `src/user/user.repository.ts`: add `findBySlug({ slug })`; convert `update`/`delete` to `updateBySlug`/`deleteBySlug` (query by `slug`, not `id`); keep `findById({ id: bigint })` for internal FK-oriented lookups
- [x] 3.3 `src/user/user.service.ts`: convert `findById`/`update`/`delete` to `findBySlug`/`updateBySlug`/`deleteBySlug`; update `toDto()` to map `slug` instead of `id`
- [x] 3.4 `src/user/user.service.ts` `login()`: set `dto.slug = user.slug` instead of `dto.id = user.id`
- [x] 3.5 `src/user/user.service.ts` `register()`: set `dto.slug = user.slug` instead of `dto.id = user.id`
- [x] 3.6 `src/user/dto/login-response.dto.ts`: replace `id: string` with `slug: string` (update `@ApiProperty` example to a ulid-shaped value, description to "User slug")
- [x] 3.7 `src/user/dto/register-response.dto.ts`: replace `id: string` with `slug: string` (same `@ApiProperty` treatment)
- [x] 3.8 `src/user/dto/user-response.dto.ts`: replace `id: string` with `slug: string`
- [x] 3.9 Check `src/user/dto/paginated-user-list.dto.ts` still references `UserResponseDto` correctly (no direct `id` field of its own expected, but verify)

## 4. Queue / event payload conversions

- [x] 4.1 `src/user/listeners/user-register-queue.listener.ts`: update `handleUserRegister` payload type to expect `id: bigint`, convert to `id.toString()` when building the `UserRegisterJobPayload`
- [x] 4.2 `src/queue/queue.types.ts`: confirm `UserRegisterJobPayload.userId` stays `string` (no change expected, verify only)
- [x] 4.3 `src/queue/processors/user-register.processor.ts`: verify it only logs/consumes `job.data.userId` as a string (no change expected, verify only)

## 5. Property module (hostId type propagation)

- [x] 5.1 `src/property/property.repository.ts`: change `hostId: string` params to `hostId: bigint` in `findByIdAndHostId`, `create`
- [x] 5.2 `src/property/property.service.ts`: change `hostId: string` params to `hostId: bigint` in `create`, `getOwnedPropertyOrThrow`, `updateBySlug`, `deleteBySlug`
- [x] 5.3 `src/property/property.controller.ts`: change `@CurrentUser() hostId: string` to `@CurrentUser() hostId: bigint` on create/update/remove

## 6. Image module (hostId type propagation)

- [x] 6.1 `src/property/image/image.service.ts`: change `hostId: string` params to `hostId: bigint` in `addImage`, `deleteImage`, `reorder`
- [x] 6.2 `src/property/image/image.controller.ts`: change `@CurrentUser() hostId: string` to `@CurrentUser() hostId: bigint` on create/remove/reorder

## 7. Favourite module (userId type propagation)

- [x] 7.1 `src/property/favourite/favourite.repository.ts`: change `userId: string` params to `userId: bigint` in `findByUserAndProperty`, `create`
- [x] 7.2 `src/property/favourite/favourite.service.ts`: change `userId: string` param to `userId: bigint` in `toggle`
- [x] 7.3 `src/property/favourite/favourite.controller.ts`: change `@CurrentUser() userId: string` to `@CurrentUser() userId: bigint` on `toggle`
- [x] 7.4 `src/property/favourite/favourite.repository.spec.ts`: update fake `userId: 'user-1'` string literals to bigint literals (e.g. `1n`)

## 8. Misc consumer

- [x] 8.1 `src/app.controller.ts` `/profile`: update to handle `userId: bigint`, return `{ userId: userId.toString() }` so the response doesn't throw on serialization

## 9. Seed script

- [x] 9.1 `prisma/seed.ts`: admin user upsert — remove `id: ulid()`, add `slug: ulid()`
- [x] 9.2 `prisma/seed.ts`: `fakeUsers` array — remove `id: ulid()`, add `slug: ulid()`
- [x] 9.3 `prisma/seed.ts`: verify `prisma.user.findMany({ select: { id: true } })` and `hostId: faker.helpers.arrayElement(users).id` still type-check with `id` as bigint (no logic change expected)

## 10. Verification

- [x] 10.1 `npm run build` — confirm no type errors anywhere `hostId`/`userId`/user `id` is referenced
- [x] 10.2 `npm run prisma:seed` against the reset dev DB — confirm admin + fake users, properties, and favourites seed cleanly
- [x] 10.3 Manually exercise `POST /users/register` -> `POST /users/login` -> guarded `GET /users` and `GET /profile` with the issued token — confirm responses expose `slug` (never `id`), the decoded JWT `sub` claim is the `slug` (never the internal id), and no BigInt serialization errors occur
- [x] 10.4 Manually exercise property create/update/delete and the favourite toggle endpoint with the issued token — confirm ownership checks still work with the new bigint `hostId`/`userId`
- [x] 10.5 Run existing test suite (`npm test`) — confirm `favourite.repository.spec.ts` and other specs pass with updated types
