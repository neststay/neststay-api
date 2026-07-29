# Property Search Indexing

## Purpose

Defines requirements for indexing properties into Typesense for search, driven by property domain events, via an isolated `search` module that keeps other modules unaware of search/Typesense concerns.

## Requirements

### Requirement: Search module listens for property creation events
The system SHALL provide a `search` module containing a listener that reacts to the `property.created` event and initiates indexing, without requiring any other module to know about search/Typesense concerns.

#### Scenario: Property created event triggers indexing
- **WHEN** a `property.created` event is emitted with a property `slug`
- **THEN** the search module's listener receives the event and passes the `slug` to the search producer

### Requirement: Search producer enqueues indexing jobs with retry and backoff
The system SHALL provide a producer that adds an indexing job to a dedicated `search_queue` BullMQ queue, configured with `attempts: 3`, exponential backoff starting at 1 second, `removeOnComplete` age of 3600 seconds, and `removeOnFail: false`.

#### Scenario: Successful enqueue
- **WHEN** the search listener invokes the producer with a valid property `slug`
- **THEN** a job is added to `search_queue` carrying the `slug`, configured with the specified retry/backoff/retention options

#### Scenario: Enqueue failure does not affect property creation
- **WHEN** enqueueing the indexing job fails (e.g. Redis unavailable)
- **THEN** the error is caught and logged by the listener and does not propagate back to the property creation request

### Requirement: Search processor indexes the property into Typesense
The system SHALL provide a BullMQ processor for `search_queue` that, on receiving an indexing job, looks up the property by its `slug`, maps it to a Typesense document, and upserts it into the `properties` collection.

#### Scenario: Job is processed successfully
- **WHEN** an indexing job is dequeued from `search_queue`
- **THEN** the processor retrieves the property by `slug`, builds a Typesense document containing `id`, `slug`, `name`, `description`, `nightlyRate`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`, `locationId`, `locationName`, `placeTypeId`, `placeTypeName`, `imageUrls` (ordered array of the property's image URLs), and `createdAt`, and upserts it into the `properties` collection
- **AND** the job completes without error

#### Scenario: Property no longer exists when job is processed
- **WHEN** an indexing job is dequeued for a `slug` that no longer exists (e.g. deleted before the job ran)
- **THEN** the processor does not create a Typesense document for that slug and completes the job without throwing

#### Scenario: Transient Typesense failure is retried
- **WHEN** the processor's upsert call to Typesense fails due to a transient error
- **THEN** BullMQ retries the job up to 3 times with exponential backoff before marking it failed

### Requirement: Typesense properties collection schema is created idempotently on bootstrap
The system SHALL ensure the Typesense `properties` collection exists with the required schema when the application starts, without failing startup if the collection already exists.

#### Scenario: Collection does not exist on first boot
- **WHEN** the application starts and the `properties` collection does not yet exist in Typesense
- **THEN** the system creates the collection with the defined schema (facetable and filterable fields for `nightlyRate`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`, `locationId`, `locationName`, `placeTypeId`, `placeTypeName`, full-text fields `name`/`description`, non-faceted display field `imageUrls`, and `createdAt` as the default sorting field)

#### Scenario: Collection already exists on subsequent boots
- **WHEN** the application starts and the `properties` collection already exists in Typesense
- **THEN** the system does not fail startup and does not attempt to recreate the collection
