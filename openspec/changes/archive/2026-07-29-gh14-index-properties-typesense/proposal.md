## Why

Properties currently live only in Postgres, so there is no way to search or facet across them (by location, place type, guest/bedroom/bathroom counts, price). To support search, newly created properties need to be indexed into Typesense asynchronously, without coupling property creation to search infrastructure or blocking the create request on an external service.

## What Changes

- `PropertyService.create` emits a `property.created` domain event (via `EventEmitter2`) carrying only the property's `slug`.
- New `search` module owns the full indexing pipeline for this event:
  - A listener that reacts to `property.created` and hands the slug to a producer.
  - A producer that enqueues a job onto a new, dedicated `search_queue` BullMQ queue, with retry/backoff configuration (attempts: 3, exponential backoff starting at 1s, `removeOnComplete` age 3600s, `removeOnFail: false`) — following the same defaults already used for the `user-events` queue.
  - A processor that dequeues the job, looks up the property via the existing `PropertyService.getBySlug`, maps it to a Typesense document (including an `imageUrls` array sourced from the property's ordered images), and upserts it into a `properties` collection.
- New Typesense client integration: `typesense` npm dependency, `typesense.config.ts` (`registerAs('typesense', ...)`) plus corresponding `.env.example` / zod validation entries for `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, `TYPESENSE_API_KEY`.
- Idempotent Typesense collection schema creation on application bootstrap (search module's `onModuleInit`), defining the `properties` collection with full-text, facet, and filter fields.
- `search_queue` is registered and owned entirely within the new `search` module (`BullModule.registerQueue`), decentralized from the existing global `QueueModule`.

Out of scope for this change: `property.updated` / `property.deleted` event handling and index sync, backfilling Typesense for properties that already exist, and any search/query API endpoints against Typesense.

## Capabilities

### New Capabilities
- `property-search-indexing`: Asynchronous indexing of created properties into Typesense via an event → queue → processor pipeline owned by a new `search` module.

### Modified Capabilities
- `property-management`: Creating a property now emits a `property.created` domain event carrying the property's slug, in addition to its existing persistence behavior.

## Impact

- **New files/modules**: `src/search/` (module, constants, listener, producer, processor, Typesense client provider/schema), `src/config/typesense.config.ts`.
- **Modified files**: `src/property/property.service.ts` (emit event), `src/property/property.constants.ts` (new, holds `PROPERTY_CREATED_EVENT`), `src/app.module.ts` (register `SearchModule`, load `typesenseConfig`), `src/config/validation.schema.ts`, `.env.example`.
- **Dependencies**: adds `typesense` npm package.
- **Infrastructure**: new BullMQ queue `search_queue` (separate from `user-events`), new Typesense collection `properties`.
