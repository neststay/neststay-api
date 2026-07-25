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

## 5. Route: List images (GET /properties/:slug/images)

- [ ] 5.1 `ImageResponseDto` (`id`, `url`, `order`, `createdAt`, `updatedAt`)
- [ ] 5.2 `ImageRepository.findAllByPropertyId(propertyId)` ordered by `order` ascending
- [ ] 5.3 `ImageService.listByPropertySlug(slug)` — resolve property id via `getIdBySlug` (no auth), map to response DTOs
- [ ] 5.4 `ImageController` `GET properties/:slug/images` endpoint (public), Swagger decorators

## 6. Route: Delete image (DELETE /properties/:slug/images/:imageId)

- [ ] 6.1 `ImageRepository.findByIdAndPropertyId(id, propertyId)` and `ImageRepository.delete(id)`
- [ ] 6.2 `ImageService.deleteImage(slug, hostId, imageId)` — resolve owned property id via `getOwnedPropertyIdBySlug`, 404 if the image doesn't exist or doesn't belong to that property, else delete
- [ ] 6.3 `ImageController` `DELETE properties/:slug/images/:imageId` endpoint with `JwtAuthGuard`, Swagger decorators

## 7. Route: Reorder images (PATCH /properties/:slug/images/order)

- [ ] 7.1 `ReorderImagesDto` + Zod schema (`imageIds: z.array(z.coerce.number().int().positive()).min(1)`)
- [ ] 7.2 `ImageRepository.updateOrders(propertyId, orderedIds)` — apply `order` by array position inside a single Prisma transaction
- [ ] 7.3 `ImageService.reorder(slug, hostId, imageIds)` — resolve owned property id, fetch current image ids, dedupe input (first occurrence wins), reject with 422 if the deduped input set doesn't exactly match the current set, else apply via `updateOrders`
- [ ] 7.4 `ImageController` `PATCH properties/:slug/images/order` endpoint with `JwtAuthGuard`, Zod validation, Swagger decorators

## 8. Tests

- [ ] 8.1 `image.repository.spec.ts` covering create, findAllByPropertyId ordering, findByIdAndPropertyId, delete, and updateOrders — mirroring `property.repository.spec.ts`'s style
- [ ] 8.2 Verify cascade delete: deleting a property removes its images (integration/repository-level test)

## 9. Verification

- [ ] 9.1 Run the full test suite and linter
- [ ] 9.2 Manually exercise all four endpoints via Swagger UI (create, list, delete, reorder — including the reject-on-partial-list and duplicate-id cases)
