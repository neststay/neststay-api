# Property Search Query

## Purpose

Defines requirements for the public `GET /search` endpoint that queries the Typesense `properties` collection by search text and optional facet filters, returning result items and facet counts without per-item database hydration.

## Requirements

### Requirement: Public search endpoint accepts query text and optional facet filters
The system SHALL provide a `GET /search` endpoint, guarded by optional authentication, accepting a required `q` query param (search text), optional `page`/`limit` params, and optional facet filter params (`locationName`, `placeTypeName`, `minNightlyRate`, `maxNightlyRate`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`).

#### Scenario: Guest performs a search
- **WHEN** an unauthenticated caller sends `GET /search?q=beach+house`
- **THEN** the request succeeds and returns matching results without requiring a bearer token

#### Scenario: Authenticated user performs a search
- **WHEN** an authenticated caller sends `GET /search?q=beach+house` with a valid bearer token
- **THEN** the request succeeds and returns matching results, and the caller's identity is available to the request

#### Scenario: Facet filters narrow results
- **WHEN** a caller sends `GET /search?q=apartment&locationName=Goa&numberOfGuests=2`
- **THEN** only properties matching the query text, `locationName=Goa`, and `numberOfGuests=2` are returned

#### Scenario: Missing required query text is rejected
- **WHEN** a caller sends `GET /search` without a `q` param
- **THEN** the system responds with a validation error (422) and does not query Typesense

### Requirement: Search results are returned without per-item database hydration
The system SHALL build search result items directly from the Typesense `properties` document fields returned by the search query, without issuing an additional database lookup per result item.

#### Scenario: Result item shape matches the indexed document
- **WHEN** a search returns matching properties
- **THEN** each result item includes `slug`, `name`, `description`, `nightlyRate`, `numberOfGuests`, `numberOfBedrooms`, `numberOfBathrooms`, `locationName`, `placeTypeName`, `imageUrls`, and `createdAt`, sourced entirely from the Typesense document (internal ids — the Typesense document `id`, `locationId`, `placeTypeId` — are not exposed; `slug` is the public identifier, matching `PropertyResponseDto`)

### Requirement: Search response includes facet counts
The system SHALL request facet counts from Typesense for `locationName`, `placeTypeName`, `numberOfGuests`, `numberOfBedrooms`, and `numberOfBathrooms`, and include them in the search response regardless of which filters the caller applied.

#### Scenario: Facet counts are returned alongside results
- **WHEN** a caller sends `GET /search?q=apartment`
- **THEN** the response includes facet counts for `locationName`, `placeTypeName`, `numberOfGuests`, `numberOfBedrooms`, and `numberOfBathrooms` reflecting the full unfiltered-by-that-facet result set

### Requirement: A Typesense query failure fails the search request
The system SHALL propagate an error to the caller when the underlying Typesense query fails, without returning partial or empty results as if the search succeeded.

#### Scenario: Typesense is unavailable
- **WHEN** the Typesense query fails (e.g. connection error)
- **THEN** `GET /search` responds with an error and does not return a 200 with empty results

### Requirement: Inactive properties are excluded from search results
The system SHALL always exclude properties where `isActive` is `false` from `GET /search` results. This filter SHALL be applied server-side and SHALL NOT be derived from, or overridable by, any caller-supplied query parameter.

#### Scenario: Inactive properties never appear in results
- **WHEN** the indexed `properties` collection contains both active and inactive documents matching a caller's search text and filters
- **THEN** the response only includes results where `isActive` is `true`

#### Scenario: Caller cannot request inactive results
- **WHEN** a caller sends `GET /search` with any combination of supported query parameters
- **THEN** there is no parameter that causes inactive properties to be included in the response
