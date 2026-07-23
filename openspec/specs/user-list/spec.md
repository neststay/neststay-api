# user-list Specification

## Purpose
TBD - created by archiving change add-pagination-infrastructure. Update Purpose after archive.
## Requirements
### Requirement: GET /users returns a paginated list of users
The system SHALL expose a `GET /users` endpoint protected by `JwtAuthGuard` that returns a paginated list of users in the standard `ResponseApiDto` envelope. The `data` field SHALL be shaped as `{ items: UserResponseDto[]; meta: PaginationMetaDto }`.

#### Scenario: Authenticated request with default params returns first page
- **WHEN** an authenticated `GET /users` request is made with no query params
- **THEN** the response SHALL have status 200 and body:
  ```json
  {
    "success": true,
    "message": "Users fetched successfully",
    "data": {
      "items": [ /* up to 10 UserResponseDto objects */ ],
      "meta": {
        "currentPage": 1,
        "isFirstPage": true,
        "isLastPage": false,
        "previousPage": null,
        "nextPage": 2,
        "pageCount": 10,
        "totalCount": 100
      }
    }
  }
  ```

#### Scenario: Authenticated request with explicit page and limit
- **WHEN** an authenticated `GET /users?page=2&limit=5` request is made
- **THEN** the response SHALL have status 200, `data.items` SHALL contain at most 5 user objects, and `data.meta.currentPage` SHALL equal 2

#### Scenario: Unauthenticated request is rejected
- **WHEN** a `GET /users` request is made without a valid JWT
- **THEN** the response SHALL have status 401

### Requirement: GET /users validates query params and rejects invalid values with 422
The system SHALL validate `page` and `limit` query params using `PaginationQuerySchema`. If validation fails, the endpoint SHALL return HTTP 422 with an error message.

#### Scenario: limit above 50 returns 422
- **WHEN** an authenticated `GET /users?limit=51` request is made
- **THEN** the response SHALL have status 422

#### Scenario: Non-integer page returns 422
- **WHEN** an authenticated `GET /users?page=abc` request is made
- **THEN** the response SHALL have status 422

#### Scenario: Zero or negative page returns 422
- **WHEN** an authenticated `GET /users?page=0` request is made
- **THEN** the response SHALL have status 422

### Requirement: GET /users response excludes sensitive fields
The system SHALL ensure that no `password` field or raw Prisma model is exposed in the `items` array. Each item SHALL conform to `UserResponseDto`.

#### Scenario: Response items omit password
- **WHEN** `GET /users` returns successfully
- **THEN** no object in `data.items` SHALL contain a `password` field

### Requirement: GET /users is documented in Swagger
The system SHALL document `GET /users` in Swagger with `@ApiOperation`, `@ApiEnvelopeResponse` using the paginated user list DTO, `@ApiHttpErrorResponse` for 401 and 422, and `@ApiPropertyOptional` on `page` and `limit` query params.

#### Scenario: Swagger UI shows the endpoint
- **WHEN** the Swagger UI at `/docs` is loaded in development mode
- **THEN** `GET /users` SHALL be listed under the `users` tag with documented query params and a typed response schema showing `items` and `meta`

