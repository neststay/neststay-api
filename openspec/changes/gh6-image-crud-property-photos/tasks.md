## 1. Database & Prisma

- [x] 1.1 Add `Image` model to `prisma/schema.prisma` (`id`, `propertyId`, `url`, `order` default `0`, `createdAt`, `updatedAt`, `@@map("images")`) with `Property images Image[]` back-relation and `onDelete: Cascade` on the `propertyId` FK
- [x] 1.2 Run `prisma migrate dev` to generate and apply the `images` table migration
- [x] 1.3 Regenerate the Prisma client

## 2. Property module: expose id-resolution methods

- [x] 2.1 Add `PropertyService.getIdBySlug(slug): Promise<bigint>` — 404 if the property does not exist
- [x] 2.2 Add `PropertyService.getOwnedPropertyIdBySlug(slug, hostId): Promise<bigint>`, reusing the existing `getOwnedPropertyOrThrow` logic but returning only the `id` (404 if missing or not owned)

## 3. Image scaffold

- [x] 3.1 Create `src/property/image/` with `image.controller.ts`, `image.service.ts`, `image.repository.ts`, `dto/` (no separate `image.module.ts`)
- [x] 3.2 Register `ImageController`, `ImageRepository`, `ImageService` in `property.module.ts`'s `controllers`/`providers` arrays alongside the existing `Property*` classes; `ImageService` injects `PropertyService` directly (no `forwardRef` needed — single module, no circular import)

## 4. Route: Add image (POST /properties/:slug/images)

- [x] 4.1 `CreateImageDto` + Zod schema (`url: z.string().url()`, `order: z.coerce.number().int().min(0).optional()`)
- [x] 4.2 `ImageRepository.create({ propertyId, url, order })`
- [x] 4.3 `ImageService.addImage(slug, hostId, data)` — resolve owned property id via `getOwnedPropertyIdBySlug`, default `order` to `0` when omitted, return response DTO
- [x] 4.4 `ImageController` `POST properties/:slug/images` endpoint with `JwtAuthGuard`, Zod validation, Swagger decorators matching the Property module's style

## 5. Property responses: embed images via relation

- [x] 5.1 `ImageResponseDto` (`id`, `url`, `order`, `createdAt`, `updatedAt`) — already created alongside the create-image route in section 4
- [x] 5.2 `PropertyRepository.findBySlug` and `PropertyRepository.findAllPaginatedByLocation` — `include: { images: { orderBy: { order: 'asc' } } }`
- [x] 5.3 `PropertyResponseDto` — add `images: PropertyImageDto[]` field (`url`, `order` only — no `id`/timestamps, per the relation-embedding architecture rule)
- [x] 5.4 `PropertyService.toDto` — map the included `images` relation to `PropertyImageDto[]` (private mapper, no dependency on `ImageService`, to avoid a circular `PropertyService` <-> `ImageService` dependency)

## 6. Route: Delete image (DELETE /properties/:slug/images/:imageId)

- [x] 6.1 `ImageRepository.findByIdAndPropertyId(id, propertyId)` and `ImageRepository.delete(id)`
- [x] 6.2 `ImageService.deleteImage(slug, hostId, imageId)` — resolve owned property id via `getOwnedPropertyIdBySlug`, 404 if the image doesn't exist or doesn't belong to that property, else delete
- [x] 6.3 `ImageController` `DELETE properties/:slug/images/:imageId` endpoint with `JwtAuthGuard`, Swagger decorators

## 7. Route: Reorder images (PATCH /properties/:slug/images/order)

- [x] 7.1 `ReorderImagesDto` + Zod schema (`imageIds: z.array(z.coerce.number().int().positive()).min(1)`)
- [x] 7.2 `ImageRepository.updateOrders(propertyId, orderedIds)` — apply `order` by array position inside a single Prisma transaction
- [x] 7.3 `ImageService.reorder(slug, hostId, imageIds)` — resolve owned property id, fetch current image ids, dedupe input (first occurrence wins), reject with 422 if the deduped input set doesn't exactly match the current set, else apply via `updateOrders`
- [x] 7.4 `ImageController` `PATCH properties/:slug/images/order` endpoint with `JwtAuthGuard`, Zod validation, Swagger decorators

## 8. Tests

- [x] 8.1 `image.repository.spec.ts` covering create, findAllByPropertyId ordering, findByIdAndPropertyId, delete, and updateOrders — mirroring `property.repository.spec.ts`'s style
- [x] 8.2 Verify cascade delete: deleting a property removes its images (integration/repository-level test) — verified via the `onDelete: Cascade` FK in `prisma/schema.prisma`; no dedicated test added (user decision: DB-enforced behavior, not application code)

## 9. Verification

- [ ] 9.1 Run the full test suite and linter
- [ ] 9.2 Manually exercise all four endpoints via Swagger UI (create, list, delete, reorder — including the reject-on-partial-list and duplicate-id cases)
