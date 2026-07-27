# Property Favourites

## Purpose

Defines requirements for authenticated users to mark properties as favourites, including toggling favourite status and ensuring favourite records stay consistent with users and properties.

## Requirements

### Requirement: Toggle a property's favourite status
The system SHALL provide an authenticated `POST /properties/:slug/favourite` endpoint, with no request body, that toggles whether the current user has favourited the property identified by `:slug`. If no favourite record exists for the (user, property) pair it SHALL be created; if one exists it SHALL be deleted.

#### Scenario: Favouriting a property for the first time
- **WHEN** an authenticated user calls `POST /properties/:slug/favourite` for a property they have not favourited
- **THEN** the system creates a favourite record for that user and property, and responds `200` with `{ success: true, message: "Property added to favourites", data: { slug, isFavourite: true } }`

#### Scenario: Unfavouriting a previously favourited property
- **WHEN** an authenticated user calls `POST /properties/:slug/favourite` for a property they have already favourited
- **THEN** the system deletes the existing favourite record for that user and property, and responds `200` with `{ success: true, message: "Property removed from favourites", data: { slug, isFavourite: false } }`

#### Scenario: Favouriting a non-existent property
- **WHEN** a user calls `POST /properties/:slug/favourite` with a `:slug` that does not match any property
- **THEN** the system responds `404 Not Found` and no favourite record is created

#### Scenario: Unauthenticated request
- **WHEN** a request to `POST /properties/:slug/favourite` is made without a valid bearer token
- **THEN** the system responds `401 Unauthorized` and no favourite record is created or deleted

#### Scenario: A host can favourite their own property
- **WHEN** a user who hosts the property calls `POST /properties/:slug/favourite` on their own listing
- **THEN** the system toggles the favourite the same as it would for any other authenticated user, with no ownership restriction applied

### Requirement: A user cannot have duplicate favourite records for the same property
The system SHALL enforce, at the database level, that at most one favourite record can exist for a given (user, property) pair at any time.

#### Scenario: Duplicate favourite creation is prevented
- **WHEN** two concurrent `POST /properties/:slug/favourite` requests from the same authenticated user both attempt to create a favourite record for a property that is not yet favourited
- **THEN** only one favourite record ever exists for that (user, property) pair once both requests complete

### Requirement: Favourite records are removed when their user or property is deleted
The system SHALL cascade-delete a favourite record when either the user or the property it references is deleted.

#### Scenario: Property deletion cascades to favourites
- **WHEN** a property that has been favourited by one or more users is deleted
- **THEN** all favourite records referencing that property are also deleted

#### Scenario: User deletion cascades to favourites
- **WHEN** a user who has favourited one or more properties is deleted
- **THEN** all favourite records belonging to that user are also deleted

### Requirement: List the authenticated user's favourited properties
The system SHALL provide an authenticated `GET /properties/favourites` endpoint that returns a paginated list of properties the current user has favourited. The user comes from the JWT, not a route or query parameter. Results SHALL be ordered by the favourite record's `createdAt` descending (most recently favourited first). The response SHALL use the same `PaginatedResponseDto` envelope (`items`/`meta`) and `PropertyResponseDto` item shape as `GET /properties`, and SHALL accept the same `page`/`limit` query convention (`page` default `1`; `limit` default `10`, max `50`).

#### Scenario: Listing favourites in most-recently-favourited order
- **WHEN** an authenticated user who has favourited multiple properties calls `GET /properties/favourites`
- **THEN** the system responds `200` with `items` containing those properties as `PropertyResponseDto` entries, ordered so the most recently favourited property appears first

#### Scenario: A user with no favourites gets an empty list
- **WHEN** an authenticated user who has not favourited any property calls `GET /properties/favourites`
- **THEN** the system responds `200` with `items: []` and pagination `meta` reflecting zero total results, not an error

#### Scenario: Paginating the favourites list
- **WHEN** an authenticated user calls `GET /properties/favourites?page=2&limit=5`
- **THEN** the system returns at most 5 items for that page, taken from the user's favourites ordered by most recently favourited first, with `meta` reflecting the requested page and limit

#### Scenario: Unauthenticated request
- **WHEN** a request to `GET /properties/favourites` is made without a valid bearer token
- **THEN** the system responds `401 Unauthorized`

#### Scenario: A user only sees their own favourites
- **WHEN** an authenticated user calls `GET /properties/favourites`
- **THEN** the response includes only properties that user has favourited, never favourites belonging to other users

#### Scenario: The favourites route is not shadowed by the single-property route
- **WHEN** an authenticated user calls `GET /properties/favourites`
- **THEN** the system routes the request to the favourites list handler, not to the `GET /properties/:slug` handler with `slug` interpreted as `"favourites"`
