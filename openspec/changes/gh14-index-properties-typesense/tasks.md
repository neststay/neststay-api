## 1. Typesense config and dependency

- [x] 1.1 Add `typesense` npm package to `package.json`
- [x] 1.2 Add `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, `TYPESENSE_API_KEY` to `src/config/validation.schema.ts`
- [x] 1.3 Create `src/config/typesense.config.ts` (`registerAs('typesense', ...)`) reading those env vars
- [x] 1.4 Register `typesenseConfig` in `ConfigModule.forRoot`'s `load` array in `src/app.module.ts`
- [x] 1.5 Confirm `.env.example` already documents the Typesense vars (present from docker-compose setup); add any missing ones

## 2. Property module: emit creation event

- [x] 2.1 Create `src/property/property.constants.ts` exporting `PROPERTY_CREATED_EVENT = 'property.created'`
- [x] 2.2 Inject `EventEmitter2` into `PropertyService`
- [x] 2.3 Emit `PROPERTY_CREATED_EVENT` with `{ slug: property.slug }` at the end of `PropertyService.create`
- [x] 2.4 Update `PropertyService` unit tests to assert the event is emitted with the correct payload on successful creation

## 3. Search module scaffolding

- [ ] 3.1 Create `src/search/search.constants.ts` exporting `SEARCH_QUEUE = 'search_queue'` and re-exporting `PROPERTY_CREATED_EVENT` as the BullMQ job name
- [ ] 3.2 Create `src/search/search.types.ts` defining `PropertyIndexJobPayload { slug: string }`
- [ ] 3.3 Create `src/search/search.module.ts` with `BullModule.registerQueue({ name: SEARCH_QUEUE })`

## 4. Typesense client and collection schema

- [ ] 4.1 Create `src/search/typesense/property-collection.schema.ts` defining the Typesense `CollectionCreateSchema` for `properties` (fields: `id`, `slug`, `name`, `description`, `nightlyRate`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`, `locationId`, `locationName`, `placeTypeId`, `placeTypeName`, `imageUrls` (string array, not faceted), `createdAt`; facet flags per design.md; `default_sorting_field: 'createdAt'`)
- [ ] 4.2 Create `src/search/typesense/typesense-client.provider.ts` constructing a Typesense `Client` from `typesenseConfig`
- [ ] 4.3 Implement idempotent collection creation on `onModuleInit` (create `properties` collection, swallow "already exists" error)
- [ ] 4.4 Register the Typesense client provider in `search.module.ts`

## 5. Search producer

- [ ] 5.1 Create `src/search/search-producer.service.ts` with `enqueuePropertyIndex({ payload: PropertyIndexJobPayload })`
- [ ] 5.2 Configure job options: `attempts: 3`, exponential backoff (1000ms), `removeOnComplete: { age: 3600 }`, `removeOnFail: false`
- [ ] 5.3 Register `SearchProducerService` as a provider in `search.module.ts`

## 6. Search listener

- [ ] 6.1 Create `src/search/listeners/property-created.listener.ts` with `@OnEvent(PROPERTY_CREATED_EVENT, { async: true })`
- [ ] 6.2 Call `SearchProducerService.enqueuePropertyIndex` with the event's `slug`; catch and log any error without rethrowing
- [ ] 6.3 Register the listener as a provider in `search.module.ts`

## 7. Search processor (Typesense indexing)

- [ ] 7.1 Import `PropertyModule` into `SearchModule` to access `PropertyService`
- [ ] 7.2 Create `src/search/processors/property-index.processor.ts` (`@Processor(SEARCH_QUEUE)`, extends `WorkerHost`)
- [ ] 7.3 In `process`, call `PropertyService.getBySlug(job.data.slug)`; if not found, complete the job without error
- [ ] 7.4 Map the property (including `location.name`, `placeType.name`, and `images` ordered by `order` ascending mapped to `imageUrls: string[]`) to the Typesense document shape
- [ ] 7.5 Upsert the document into the `properties` collection via the Typesense client
- [ ] 7.6 Register `PropertyIndexProcessor` as a provider in `search.module.ts`

## 8. Wiring and verification

- [ ] 8.1 Register `SearchModule` in `src/app.module.ts` imports
- [ ] 8.2 Verify `PropertyRepository`/`PropertyService.getBySlug` already returns `location`, `placeType`, and ordered `images` relations needed for indexing; extend the repository's `include` if not
- [ ] 8.3 Manually verify end-to-end: create a property, confirm a job appears in Bull Board for `search_queue`, confirm the document appears in the Typesense `properties` collection via the Typesense dashboard
- [ ] 8.4 Add/update tests for `SearchProducerService`, `PropertyCreatedListener`, and `PropertyIndexProcessor`
