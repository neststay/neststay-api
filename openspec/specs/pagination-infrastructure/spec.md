# pagination-infrastructure Specification

## Purpose
TBD - created by archiving change add-pagination-infrastructure. Update Purpose after archive.
## Requirements
### Requirement: Prisma client is extended with page-number pagination
The system SHALL extend `PrismaService` with `prisma-extension-pagination` and expose the extended client as a typed property. The extension SHALL be configured with `pages.limit: 10` (default page size) and `pages.includePageCount: true`.

#### Scenario: Extended client is available to repositories
- **WHEN** a repository injects `PrismaService`
- **THEN** it SHALL be able to call `.paginate().withPages({ page, limit })` on any model delegate via the extended client property

#### Scenario: Default page size is applied when limit is omitted
- **WHEN** `.withPages({ page: 1 })` is called without an explicit `limit`
- **THEN** the extension SHALL return at most 10 records

### Requirement: Shared pagination query Zod schema validates page and limit
The system SHALL provide a `PaginationQuerySchema` Zod schema under `src/common/pagination/` that validates:
- `page`: integer ≥ 1, default 1
- `limit`: integer between 1 and 50 inclusive, default 10

Invalid values SHALL cause validation to fail so the controller can return 422.

#### Scenario: Valid page and limit pass validation
- **WHEN** `PaginationQuerySchema.parse({ page: 2, limit: 25 })` is called
- **THEN** it SHALL return `{ page: 2, limit: 25 }` without throwing

#### Scenario: Omitted params use defaults
- **WHEN** `PaginationQuerySchema.parse({})` is called
- **THEN** it SHALL return `{ page: 1, limit: 10 }`

#### Scenario: limit above 50 fails validation
- **WHEN** `PaginationQuerySchema.parse({ limit: 51 })` is called
- **THEN** it SHALL throw a Zod validation error

#### Scenario: Non-integer or zero values fail validation
- **WHEN** `PaginationQuerySchema.parse({ page: 0 })` or `PaginationQuerySchema.parse({ limit: 'abc' })` is called
- **THEN** it SHALL throw a Zod validation error

### Requirement: Shared pagination DTOs document query params and response shape
The system SHALL provide the following classes under `src/common/pagination/`:
- `PaginationQueryDto` — Swagger `@ApiPropertyOptional()` class for `page` and `limit`
- `PaginationMetaDto` — typed class with fields: `currentPage`, `isFirstPage`, `isLastPage`, `previousPage`, `nextPage`, `pageCount`, `totalCount`
- `PaginatedResponseDto<T>` — generic class with `items: T[]` and `meta: PaginationMetaDto`

#### Scenario: PaginationMetaDto fields match prisma-extension-pagination output
- **WHEN** a `withPages()` result meta is mapped to `PaginationMetaDto`
- **THEN** all seven meta fields SHALL be present and correctly typed

#### Scenario: PaginatedResponseDto wraps items and meta
- **WHEN** `PaginatedResponseDto<UserResponseDto>` is constructed
- **THEN** it SHALL have an `items` array and a `meta` object of type `PaginationMetaDto`

### Requirement: Pagination result mapper maps extension output to DTO
The system SHALL provide a `mapToPaginatedResponse<T>` helper in `src/common/pagination/pagination.helper.ts` that accepts the `[rows, meta]` tuple returned by `withPages()` and an item mapper function, and returns a `PaginatedResponseDto<T>`.

#### Scenario: Mapper produces correct structure
- **WHEN** `mapToPaginatedResponse([rows, meta], itemMapper)` is called
- **THEN** it SHALL return `{ items: rows.map(itemMapper), meta }` typed as `PaginatedResponseDto<T>`

