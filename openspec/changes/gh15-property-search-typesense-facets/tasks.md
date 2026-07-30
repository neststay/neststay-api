## 1. Dependency check

- [x] 1.1 Confirm `gh14-index-properties-typesense` is applied: `search` module, Typesense client provider, and `properties` collection (including `imageUrls`) exist and are populated

## 2. search_history data model

- [x] 2.1 Add `SearchHistory` model to `prisma/schema.prisma`: `id` (BigInt, `@id @default(autoincrement())`), `searchId` (String, `@unique`), `userId` (BigInt?, nullable), `query` (String), `createdAt` (DateTime, `@default(now())`), `@@map("search_history")`
- [x] 2.2 Generate and run the Prisma migration for `search_history`

## 3. DTOs

- [x] 3.1 Create `src/search/dto/search-query.dto.ts` with `SearchQueryDto` (Swagger) and a zod `SearchQuerySchema` validating `q` (required string), `page`/`limit` (coerced ints, same defaults/bounds as `ListPropertyQuerySchema`), and optional `locationName`, `placeTypeName` (strings), `minNightlyRate`, `maxNightlyRate`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms` (coerced numbers)
- [x] 3.2 Create `src/search/dto/search-result-item.dto.ts` (`SearchResultItemDto`) with fields `slug`, `name`, `description`, `nightlyRate`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`, `locationName`, `placeTypeName`, `imageUrls`, `createdAt` (no `id`, `locationId`, or `placeTypeId` — `slug` is the public identifier), matching the Typesense `properties` document shape
- [x] 3.3 Create `src/search/dto/search-facets.dto.ts` (`SearchFacetsDto`) representing facet counts for `locationName`, `placeTypeName`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`
- [x] 3.4 Create `src/search/dto/search-response.dto.ts` (`SearchResponseDto`) with `searchId` (string), `items` (`SearchResultItemDto[]`), `facets` (`SearchFacetsDto`), and pagination `meta` (reuse `PaginationMetaDto`)

## 4. search_history repository

- [ ] 4.1 Create `src/search/search-history.repository.ts` (`SearchHistoryRepository`) with a `create({ userId, query }: { userId: bigint | null; query: string }): Promise<{ searchId: string }>` method that generates `searchId` via `ulid()` and inserts the row via `PrismaService`
- [ ] 4.2 Add unit tests for `SearchHistoryRepository.create` covering both a `userId` present and `userId: null`

## 5. Typesense query integration

- [ ] 5.1 In the `search` module, add a method (e.g. on a new `TypesenseSearchClient` or directly in `SearchQueryService`) that builds a Typesense `search()` call from validated query params: `q` mapped to `query_by: 'name,description'`, facet filters mapped to `filter_by`, `facet_by: 'locationName,placeTypeName,numberOfGuests,numberOfBedrooms,numberOfBathrooms'`, and `page`/`per_page` from the request
- [ ] 5.2 Map Typesense hits to `SearchResultItemDto[]` and Typesense `facet_counts` to `SearchFacetsDto`

## 6. Search orchestration service

- [ ] 6.1 Create `src/search/search-query.service.ts` (`SearchQueryService`) with a `search({ query, filters, page, limit, userId }): Promise<SearchResponseDto>` method
- [ ] 6.2 Generate the `searchId` up front, then run the Typesense query (5.1/5.2) and `SearchHistoryRepository.create` (4.1) concurrently (e.g. `Promise.allSettled`)
- [ ] 6.3 If the Typesense call rejected, rethrow its error; if the `search_history` write rejected, log it and continue without failing the request
- [ ] 6.4 Assemble and return `SearchResponseDto` with `searchId` set to the generated `searchId` regardless of whether the history write succeeded
- [ ] 6.5 Add unit tests for `SearchQueryService.search`: successful search, Typesense failure propagates, `search_history` write failure is swallowed and `searchId` still returned

## 7. Controller and route

- [ ] 7.1 Create `src/search/search.controller.ts` (`SearchController`) with `GET /search`, `@UseGuards(OptionalJwtAuthGuard)`, validating query params with `SearchQuerySchema` (422 on failure, matching `PropertyController`'s pattern) and calling `SearchQueryService.search`
- [ ] 7.2 Add Swagger decorators (`@ApiTags('search')`, `@ApiOperation`, `@ApiEnvelopeResponse(200, ..., SearchResponseDto)`, `@ApiHttpErrorResponse(422, ...)`)
- [ ] 7.3 Register `SearchController`, `SearchHistoryRepository`, and `SearchQueryService` as providers/controllers in `search.module.ts`
- [ ] 7.4 Add controller tests covering guest search, authenticated search, facet filter params, and the 422 case for a missing `q`

## 8. Verification

- [ ] 8.1 Manually verify end-to-end: seed/create a property (indexed via gh14), call `GET /search?q=...` as both a guest and an authenticated user, confirm results, facets, and `searchId` are returned, and confirm a matching `search_history` row exists in Postgres
