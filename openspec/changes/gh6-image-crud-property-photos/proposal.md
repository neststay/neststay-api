## Why

Properties currently have no way to store photos. Hosts need to attach image URLs to a property, control the order photos are displayed in, and remove images; public viewers need to see a property's images when browsing listings.

## What Changes

- Add a new `Image` model/table (`images`) with `id`, `propertyId` (FK to `Property`, cascade delete), `url`, `order`, `createdAt`, `updatedAt`.
- Add `POST /properties/:slug/images` — authenticated property owner attaches an image (`url`, optional `order`, defaults to `0`) to their property.
- Add `GET /properties/:slug/images` — public, lists all images for a property.
- Add `DELETE /properties/:slug/images/:imageId` — authenticated property owner removes an image; 404 if the property doesn't exist, isn't owned by the caller, or the image doesn't belong to that property.
- Add `PATCH /properties/:slug/images/order` — authenticated property owner reorders images by supplying the full ordered list of `imageIds`; request is rejected if the list omits any of the property's current images, duplicates are tolerated (first occurrence wins).
- Property deletion now cascades to delete its images (**BREAKING** in the sense that deleting a property with images no longer needs images removed first — it becomes automatic).

## Capabilities

### New Capabilities
- `property-images`: create, list, delete, and reorder images belonging to a property, with ownership enforcement on mutating operations.

### Modified Capabilities
- `property-management`: deleting a property now cascades to delete all of its images (previously images didn't exist, so this is a new consequence of the existing "Delete a property" requirement).

## Impact

- **Database**: new `images` table + migration; new FK relation from `Property` to `Image` with `onDelete: Cascade`.
- **Code**: new `Image` controller/service/repository/DTOs under `src/property/image/`, registered directly on `PropertyModule` (no separate `ImageModule`); `ImageService` calls `PropertyService` (never `PropertyRepository` directly) for ownership checks.
- **APIs**: 4 new endpoints, all nested under `/properties/:slug/images`.
- No changes to existing Property endpoints' request/response shapes.
