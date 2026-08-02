## MODIFIED Requirements

### Requirement: List the authenticated user's favourited properties
The system SHALL provide an authenticated `GET /properties/favourites` endpoint that returns a paginated list of properties the current user has favourited, where `isActive` is `true`. The user comes from the JWT, not a route or query parameter. Results SHALL be ordered by the favourite record's `createdAt` descending (most recently favourited first). The response SHALL use the same `PaginatedResponseDto` envelope (`items`/`meta`) and `PropertyResponseDto` item shape as `GET /properties`, and SHALL accept the same `page`/`limit` query convention (`page` default `1`; `limit` default `10`, max `50`).

#### Scenario: Listing favourites in most-recently-favourited order
- **WHEN** an authenticated user who has favourited multiple active properties calls `GET /properties/favourites`
- **THEN** the system responds `200` with `items` containing those properties as `PropertyResponseDto` entries, ordered so the most recently favourited property appears first

#### Scenario: Inactive favourited properties are excluded
- **WHEN** an authenticated user has favourited a property that is currently inactive
- **THEN** the system's response does not include that property, even though a favourite record for it still exists

#### Scenario: A user with no favourites gets an empty list
- **WHEN** an authenticated user who has not favourited any property calls `GET /properties/favourites`
- **THEN** the system responds `200` with `items: []` and pagination `meta` reflecting zero total results, not an error

#### Scenario: Paginating the favourites list
- **WHEN** an authenticated user calls `GET /properties/favourites?page=2&limit=5`
- **THEN** the system returns at most 5 items for that page, taken from the user's active favourites ordered by most recently favourited first, with `meta` reflecting the requested page and limit

#### Scenario: Unauthenticated request
- **WHEN** a request to `GET /properties/favourites` is made without a valid bearer token
- **THEN** the system responds `401 Unauthorized`

#### Scenario: A user only sees their own favourites
- **WHEN** an authenticated user calls `GET /properties/favourites`
- **THEN** the response includes only properties that user has favourited, never favourites belonging to other users

#### Scenario: The favourites route is not shadowed by the single-property route
- **WHEN** an authenticated user calls `GET /properties/favourites`
- **THEN** the system routes the request to the favourites list handler, not to the `GET /properties/:slug` handler with `slug` interpreted as `"favourites"`
