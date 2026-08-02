## 1. Data model

- [x] 1.1 Add `isActive Boolean @default(true)` to the `Property` model in `schema.prisma`
- [x] 1.2 Generate and run the Prisma migration (additive column, no backfill script needed)

## 2. Expose isActive on list and detail reads

- [x] 2.1 Add `isActive` to `PropertyResponseDto` and map it in `PropertyService.toResponseDto`
- [x] 2.2 Update `PropertyRepository.findAllPaginatedByLocation` to filter `where: { isActive: true }`
- [x] 2.3 Confirm `GET /properties/:slug` (via `findBySlug` / `toResponseDto`) returns `isActive` for both active and inactive properties, with no filtering applied

## 3. Filter favourites list

- [x] 3.1 Update the favourites listing query (`FavouriteRepository`) to filter the joined property on `isActive: true`
- [x] 3.2 Confirm favouriting/unfavouriting itself (`POST /properties/:slug/favourite`) remains unaffected by property status — a user can still favourite an inactive property, it just won't appear in the favourites list

## 4. Activate endpoint (end-to-end)

- [x] 4.1 Add `PROPERTY_ACTIVATED_EVENT` constant to `property.constants.ts`
- [x] 4.2 Add a `PropertyRepository` method to set `isActive: true` by property id
- [x] 4.3 Add `PropertyService.activateBySlug(slug, hostId)`: reuse `getOwnedPropertyOrThrow`, apply the update, emit `PROPERTY_ACTIVATED_EVENT` with `{ slug }`, return the response DTO
- [x] 4.4 Add `POST /properties/:slug/activate` to `PropertyController`, guarded by `JwtAuthGuard`, with swagger decorators matching the update/delete routes' style

## 5. Deactivate endpoint (end-to-end)

- [x] 5.1 Add `PROPERTY_DEACTIVATED_EVENT` constant to `property.constants.ts`
- [x] 5.2 Add a `PropertyRepository` method to set `isActive: false` by property id
- [x] 5.3 Add `PropertyService.deactivateBySlug(slug, hostId)`: reuse `getOwnedPropertyOrThrow`, apply the update, emit `PROPERTY_DEACTIVATED_EVENT` with `{ slug }`, return the response DTO
- [x] 5.4 Add `POST /properties/:slug/deactivate` to `PropertyController`, guarded by `JwtAuthGuard`, with swagger decorators matching the update/delete routes' style

## 6. Search: index isActive

- [x] 6.1 Add a filterable `isActive` boolean field to `propertiesCollectionSchema`
- [x] 6.2 Add `isActive` to the `PropertyDocument` type in `search.types.ts`
- [x] 6.3 Update `PropertyIndexProcessor.toDocument` to map `property.isActive` into the document

## 7. Search: listeners for activation/deactivation events

- [x] 7.1 Add a listener reacting to `PROPERTY_ACTIVATED_EVENT` in `src/search/listeners/`, calling `SearchProducerService.enqueuePropertyIndex` with the event's `slug`, following the same `{ async: true }` + try/catch pattern as `PropertyCreatedListener`
- [x] 7.2 Add a listener reacting to `PROPERTY_DEACTIVATED_EVENT` in `src/search/listeners/`, same pattern
- [x] 7.3 Register both new listeners as providers in `SearchModule`

## 8. Search: enforce isActive filter in query

- [x] 8.1 Update `TypesenseSearchClient.buildFilterBy` to always append `isActive:=true` to the constructed `filter_by`, independent of `TypesenseSearchFilters`
- [x] 8.2 Confirm `SearchQueryDto` / `SearchController` / `SearchQueryService` never accept or forward a client-supplied `isActive` value

## 9. Tests

- [ ] 9.1 `PropertyService`/`PropertyController` unit tests for activate/deactivate: owner success, non-owner 404, missing slug 404, unauthenticated 401, idempotent re-activation/re-deactivation, event emission
- [ ] 9.2 `PropertyRepository` tests confirming `findAllPaginatedByLocation` and the favourites query exclude inactive properties
- [ ] 9.3 `PropertyIndexProcessor` test confirming the upserted document includes the property's current `isActive` value
- [ ] 9.4 New listener tests confirming `PROPERTY_ACTIVATED_EVENT`/`PROPERTY_DEACTIVATED_EVENT` enqueue an index job and that enqueue failure is caught and logged, not rethrown
- [ ] 9.5 `TypesenseSearchClient` test confirming `filter_by` always includes `isActive:=true` regardless of caller-supplied filters

## 10. Manual verification

- [ ] 10.1 Via Bruno/curl: create a property, deactivate it, confirm it disappears from `GET /properties` and `GET /properties/favourites` (if favourited) but `GET /properties/:slug` still returns it with `isActive: false`
- [ ] 10.2 Confirm the deactivated property drops out of `GET /search` results after the reindex job completes, then reactivate and confirm it reappears
