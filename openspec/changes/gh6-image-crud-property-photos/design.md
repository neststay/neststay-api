## Context

Properties are addressed publicly by `slug`; the internal BigInt `id` is never returned or accepted from clients (`docs/architecture/index.md`: "models which will be public facing, will have a slug column"). The existing `PropertyService.getOwnedPropertyOrThrow` (private) already implements the "404 for both missing and not-owned" pattern used by update/delete.

Per the global rules, only services (not repositories) may be injected across module boundaries, and controllers must call services, never repositories. Image needs to resolve a `slug` to a property's internal `id` (for public list) and to an *owned* property's `id` (for create/delete/reorder).

## Goals / Non-Goals

**Goals:**
- Let hosts attach, delete, and reorder images on properties they own, and let any caller see a property's images as part of viewing that property.
- Reuse the Property module's existing ownership-check pattern rather than re-implementing it.
- Keep `Image.id` internal-BigInt-but-exposed — unlike `Property`, Image does not get a `slug`.
- Follow the architecture rule (`docs/architecture/index.md`) to embed related data via the database relation rather than a separate per-item API call, especially for anything returned in a paginated list.

**Non-Goals:**
- No file upload / storage handling — `url` is client-supplied and assumed already hosted elsewhere.
- No image processing (resizing, thumbnails, format checks beyond URL shape).
- No cap on images per property in this change.

## Decisions

**1. No separate `ImageModule` — `Image`'s controller/service/repository are registered directly on `PropertyModule`.**
`src/property/image/` holds `image.controller.ts`, `image.service.ts`, `image.repository.ts`, and `dto/`, but there is no `image.module.ts`. `PropertyModule`'s `controllers`/`providers` arrays list `ImageController`, `ImageService`, and `ImageRepository` alongside the existing `Property*` classes.

Alternative considered: give `Image` its own `ImageModule` imported by `PropertyModule`. Rejected — `Image` has no independent existence (it cannot exist without a `Property`) and nothing else in the app needs to import it in isolation, so a second module bought no real encapsulation. It also forced a circular import (`PropertyModule` → `ImageModule` for routing, `ImageModule` → `PropertyModule` for `PropertyService`), which would have needed `forwardRef()` on both sides purely to work around a boundary that added no value here. Folding both resources into one module removes the circular dependency entirely.

**2. `ImageService` still calls `PropertyService` for ownership checks, not `PropertyRepository` directly.**
Even though `ImageService` and `PropertyRepository` are now providers of the same module (so nothing stops direct injection), the ownership/lookup logic stays in `PropertyService` as the single source of truth:
- `getIdBySlug(slug): Promise<bigint>` — 404 if not found. Used by the public `GET .../images` list.
- `getOwnedPropertyIdBySlug(slug, hostId): Promise<bigint>` — promotes the existing private `getOwnedPropertyOrThrow` logic (404 if missing *or* not owned) but returns only the `id`, not the full `PropertyModel`.

Alternative considered: have `ImageService` inject `PropertyRepository` directly and re-run the ownership check itself. Rejected — it would duplicate the "missing or not owned → 404" logic in two places; routing through `PropertyService` keeps that rule defined once.

**3. `ImageController` is a distinct controller from `PropertyController`, mounted at `properties/:slug/images`.**
Nest allows independent controllers within the same module to share a path prefix. Keeping `Image` CRUD in its own controller (rather than adding methods to `PropertyController`) keeps each controller focused on one resource, even though both now live in the same module.

**4. Image addressing uses raw `id`, not a `slug`, intentionally deviating from the "public-facing models get a slug" rule.**
Rationale: a `Property`'s slug exists to prevent enumeration of properties/hosts by guessing sequential ids on a *top-level* public resource. An `Image` is never addressed on its own — every Image route is already scoped inside an unguessable property `slug`, and mutating routes additionally require ownership. Exposing sequential image ids inside that scope doesn't enable meaningful enumeration, and the user-facing requirement (delete/reorder by numeric id) is simpler this way. Called out here per the design rule requiring intentional deviations to be flagged.

**5. Reorder is validated and applied as a set operation, not a diff.**
`ImageService.reorder(slug, hostId, imageIds)`:
1. Resolve owned property id via `getOwnedPropertyIdBySlug`.
2. Fetch the property's current image ids from `ImageRepository`.
3. Dedupe the input `imageIds`, keeping the first occurrence of each id.
4. Compare the deduped input set to the current set — if any current image id is absent from the input, reject the whole request (422/400, no partial application).
5. Apply the new `order` (0-indexed by position) to every image inside a single Prisma transaction.

Alternative considered: allow partial reorders (only touch ids present in the payload). Rejected per explicit product decision — a partial list is treated as an invalid request, not a partial update.

**6. `Image.propertyId` FK uses `onDelete: Cascade`.**
Deleting a property removes its images automatically; `PropertyRepository.delete` needs no change.

**8. Images are read only as an embedded relation on Property responses — there is no `GET /properties/:slug/images` endpoint.**
`PropertyRepository.findBySlug` and `PropertyRepository.findAllPaginatedByLocation` both `include: { images: { orderBy: { order: 'asc' } } }`. `PropertyService.toDto` maps the included `images` relation onto a new `images: PropertyImageDto[]` field on `PropertyResponseDto`, via a small private mapper on `PropertyService` (not a call into `ImageService`, to avoid a circular dependency between the two services).

`PropertyImageDto` is intentionally a trimmer shape than `ImageResponseDto`: only `url` and `order`, no `id`/`createdAt`/`updatedAt`. Per the architecture rule on embedded relations, an entity's `id` is only returned when that entity is the primary resource of the response (as the create-image route's `ImageResponseDto` is) — not when it rides along as a relation of something else. Timestamps were evaluated against the same rule and dropped: nothing in this change's scenarios needs an image's `createdAt`/`updatedAt` when it's just being displayed as part of a property.

Alternative considered: a dedicated `GET /properties/:slug/images` endpoint (this change's original plan, and briefly implemented). Rejected per the architecture rule requiring related data to be embedded via relation rather than fetched with a separate call — this matters most for `GET /properties`, where a per-property images call would mean one extra request per item in every page of results. Since practically every property view needs its images, and the mutating endpoints (add/delete/reorder) already require the `slug`, embedding costs nothing extra for hosts and removes a mandatory round trip for every property view.

**7. Validation via Zod schemas**, matching the existing `CreatePropertySchema` pattern: `url: z.string().url()`, `order: z.coerce.number().int().min(0).optional()` (defaulted to `0` in the service/repository when absent), `imageIds: z.array(z.coerce.number().int().positive()).min(1)`.

## Risks / Trade-offs

- **[Risk] Concurrent reorder requests could race** → Mitigation: the transactional write means each request is atomic; last-write-wins between two concurrent full-reorders is acceptable (no partial corruption possible).
- **[Risk] Promoting `getOwnedPropertyOrThrow` to public slightly widens `PropertyService`'s surface** → Mitigation: the new methods return only a `bigint` id, not model internals, keeping the leak minimal and consistent with existing encapsulation.
- **[Trade-off] `PropertyModule` now owns two resources' worth of providers/controllers** → accepted per Decision 1; if `Image` ever needs independent reuse by another module, split it into its own `ImageModule` and export what's needed then — not worth the indirection today.
- **[Trade-off] No slug for Image** → accepted per Decision 4; revisit if Images ever need to be addressed outside a property's scope.
- **[Trade-off] The public property endpoints never return an image's `id`, so once past its create-response, a host has no way to look up an existing image's `id` through this change's endpoints alone** → accepted: image management (delete, reorder) is a privileged host/admin activity that belongs behind its own separate, privileged API surface, not the public property responses. That privileged surface is out of scope for this change and will be designed separately when it's needed.

## Migration Plan

1. Add `Image` model to `schema.prisma` with the `Property.images Image[]` back-relation and `onDelete: Cascade`.
2. Run `prisma migrate dev` to generate the `images` table migration.
3. Ship the `Image` controller/service/repository as part of `PropertyModule`; no data backfill needed (new table, no existing rows).
4. Rollback: drop the migration; no existing data depends on `images`.

## Open Questions

- None outstanding — all prior ambiguities were resolved during exploration (slug-based addressing, public list, `order` default `0`, strict full-set reorder validation with duplicate-tolerant dedup, cascade delete).
