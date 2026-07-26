## MODIFIED Requirements

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
