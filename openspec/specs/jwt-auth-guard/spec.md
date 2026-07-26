# JWT Auth Guard

## Purpose

Provide secure JWT-based authentication for protecting API routes, enabling bearer token validation and user identification via the @CurrentUser() decorator and @UseGuards(JwtAuthGuard) guard.

## Requirements

### Requirement: Valid Bearer token grants access to guarded routes
The system SHALL allow requests presenting a valid, non-expired JWT in the `Authorization: Bearer <token>` header to access routes decorated with `@UseGuards(JwtAuthGuard)`. The token MUST be signed with `JWT_SECRET` and contain a `sub` claim representing the authenticated user's public `slug` (ulid) — never the internal bigint `id`, since a JWT payload is only base64-encoded and readable by anyone holding the token. The system SHALL resolve `sub` to the user's internal id via a `slug` lookup during validation, rejecting the request if no user matches.

#### Scenario: Valid token on guarded route
- **WHEN** a request arrives at a guarded route with `Authorization: Bearer <valid-token>`
- **THEN** the system returns `200 OK` and the handler receives the authenticated user's internal id (as a `bigint`, resolved from the token's `slug` via a database lookup) via `@CurrentUser()`

#### Scenario: Handler receives userId resolved from token slug
- **WHEN** a guarded handler uses `@CurrentUser()` and the token payload contains `{ sub: "<user-slug>" }`
- **THEN** the system looks up the user by `slug` and `@CurrentUser()` returns that user's internal `id` as a `bigint`

#### Scenario: Token references a user that no longer exists
- **WHEN** a request presents a validly-signed, non-expired token whose `sub` slug does not match any user
- **THEN** the system returns `401 Unauthorized`

### Requirement: Missing Authorization header returns 401
The system SHALL reject requests to guarded routes that do not include an `Authorization` header with `401 Unauthorized`.

#### Scenario: No Authorization header on guarded route
- **WHEN** a request arrives at a guarded route with no `Authorization` header
- **THEN** the system returns `401 Unauthorized`

### Requirement: Invalid or tampered token returns 401
The system SHALL reject requests presenting a JWT that has been tampered with, signed with a different secret, or is otherwise malformed.

#### Scenario: Token signed with wrong secret
- **WHEN** a request arrives at a guarded route with a token signed with a different secret
- **THEN** the system returns `401 Unauthorized`

#### Scenario: Malformed token string
- **WHEN** a request arrives at a guarded route with `Authorization: Bearer not-a-jwt`
- **THEN** the system returns `401 Unauthorized`

### Requirement: Expired token returns 401
The system SHALL reject requests presenting a JWT whose `exp` claim is in the past.

#### Scenario: Expired token on guarded route
- **WHEN** a request arrives at a guarded route with a token whose expiry has passed
- **THEN** the system returns `401 Unauthorized`

### Requirement: Unguarded routes remain publicly accessible
The system SHALL allow requests to routes without `@UseGuards(JwtAuthGuard)` to proceed regardless of whether an `Authorization` header is present.

#### Scenario: Public route with no token
- **WHEN** a request arrives at a public (unguarded) route with no `Authorization` header
- **THEN** the system returns the normal success response

#### Scenario: Public route with a token present
- **WHEN** a request arrives at a public (unguarded) route with a valid Bearer token
- **THEN** the system returns the normal success response (token is ignored)

### Requirement: JWT configuration driven by environment variables
The system SHALL read JWT signing secret and token expiry from environment configuration. The `JWT_SECRET` variable is required; the application MUST fail to start if it is absent. `JWT_EXPIRES_IN` is optional and MUST have a documented default.

#### Scenario: Missing JWT_SECRET causes startup failure
- **WHEN** the application starts without `JWT_SECRET` set in the environment
- **THEN** the application throws a startup error and does not serve requests

#### Scenario: JWT_EXPIRES_IN controls token validity window
- **WHEN** `JWT_EXPIRES_IN` is set to `"1h"` and a token is issued
- **THEN** requests with that token succeed within 1 hour and fail after expiry
