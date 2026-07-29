# Optional JWT Auth Guard

## Purpose

Defines requirements for optional JWT authentication: routes that behave differently for authenticated vs. anonymous callers without rejecting unauthenticated requests.

## Requirements

### Requirement: Valid Bearer token populates the current user without requiring one
The system SHALL provide a guard (`OptionalJwtAuthGuard`) that, when a request presents a valid, non-expired JWT in the `Authorization: Bearer <token>` header, resolves it the same way as `JwtAuthGuard` (via `JwtStrategy`, `sub` slug → internal id lookup) and populates `request.user` with the authenticated user's id. Unlike `JwtAuthGuard`, this guard SHALL NOT reject the request when the header is missing, malformed, expired, or references a user that no longer exists — the request proceeds with no `request.user`.

#### Scenario: Valid token on a route guarded by OptionalJwtAuthGuard
- **WHEN** a request arrives at a route decorated with `@UseGuards(OptionalJwtAuthGuard)` with `Authorization: Bearer <valid-token>`
- **THEN** the system allows the request through and the handler can read the authenticated user's internal id (as a `bigint`) via `@CurrentUserOptional()`

#### Scenario: No Authorization header on a route guarded by OptionalJwtAuthGuard
- **WHEN** a request arrives at a route decorated with `@UseGuards(OptionalJwtAuthGuard)` with no `Authorization` header
- **THEN** the system allows the request through with a `200 OK`-eligible response and `@CurrentUserOptional()` returns `null`

#### Scenario: Invalid, expired, or unresolvable token on a route guarded by OptionalJwtAuthGuard
- **WHEN** a request arrives at a route decorated with `@UseGuards(OptionalJwtAuthGuard)` with a token that is malformed, signed with the wrong secret, expired, or whose `sub` slug matches no user
- **THEN** the system allows the request through (does not return 401) and `@CurrentUserOptional()` returns `null`

### Requirement: CurrentUserOptional decorator exposes a nullable authenticated user id
The system SHALL provide a `@CurrentUserOptional()` param decorator returning `bigint | null`, reading `request.user?.userId ?? null`, for use on routes guarded by `OptionalJwtAuthGuard`.

#### Scenario: Authenticated request
- **WHEN** `@CurrentUserOptional()` is used on a request where `OptionalJwtAuthGuard` populated `request.user`
- **THEN** it returns that user's internal id as a `bigint`

#### Scenario: Anonymous request
- **WHEN** `@CurrentUserOptional()` is used on a request where `OptionalJwtAuthGuard` did not populate `request.user`
- **THEN** it returns `null`
