# Dev Query Logging

## Purpose

Defines requirements for correlating Prisma queries to the HTTP request that triggered them and surfacing per-request query diagnostics (log summary and `X-Query-Count` header) for local development, gated entirely behind `APP_DEBUG` so there is no overhead when disabled.

## Requirements

### Requirement: Prisma queries are correlated to the triggering request
The system SHALL use an `AsyncLocalStorage` context, opened per HTTP request by a global interceptor, to collect Prisma `query` events emitted while that request's handler is executing, so that concurrent requests do not have their query events interleaved.

#### Scenario: Two concurrent requests each see only their own queries
- **WHEN** two HTTP requests are in flight concurrently and each triggers Prisma queries
- **THEN** the query summary logged for each request SHALL contain only the queries issued while that request's handler was executing

#### Scenario: Query emitted outside any request context
- **WHEN** a Prisma query runs outside of an HTTP request (e.g. during a seed script or a queue processor)
- **THEN** the system SHALL NOT attempt to attribute it to any request and SHALL NOT error

### Requirement: Per-request query summary is logged when APP_DEBUG is enabled
When `appConfig.debug` is `true`, the system SHALL log a summary containing the number of queries, the total query duration, and the list of executed SQL statements for each HTTP request, once the request's response is ready to be sent.

#### Scenario: Request triggers database queries with APP_DEBUG enabled
- **WHEN** an HTTP request with `APP_DEBUG=true` causes one or more Prisma queries to execute
- **THEN** the system SHALL log a summary showing the query count, total duration, and SQL list for that request

#### Scenario: Request triggers no database queries
- **WHEN** an HTTP request with `APP_DEBUG=true` causes no Prisma queries to execute
- **THEN** the system SHALL log a summary showing a query count of zero

### Requirement: X-Query-Count header is set when APP_DEBUG is enabled
When `appConfig.debug` is `true`, the system SHALL set an `X-Query-Count` response header on every HTTP response equal to the number of Prisma queries executed while handling that request.

#### Scenario: Response header reflects query count
- **WHEN** an HTTP request with `APP_DEBUG=true` causes 3 Prisma queries to execute
- **THEN** the HTTP response SHALL include header `X-Query-Count: 3`

### Requirement: No query logging overhead when APP_DEBUG is disabled
When `appConfig.debug` is `false` (the default), the system SHALL NOT register a Prisma query event listener, SHALL NOT open an `AsyncLocalStorage` context per request, SHALL NOT log any query summary, and SHALL NOT set the `X-Query-Count` header.

#### Scenario: Request completes without logging artifacts when APP_DEBUG is disabled
- **WHEN** an HTTP request is handled while `APP_DEBUG` is `false` (or unset)
- **THEN** no query summary SHALL be logged
- **AND** the response SHALL NOT include an `X-Query-Count` header
