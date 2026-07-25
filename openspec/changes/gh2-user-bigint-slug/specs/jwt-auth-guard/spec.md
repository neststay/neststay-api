## MODIFIED Requirements

### Requirement: Valid Bearer token grants access to guarded routes
The system SHALL allow requests presenting a valid, non-expired JWT in the `Authorization: Bearer <token>` header to access routes decorated with `@UseGuards(JwtAuthGuard)`. The token MUST be signed with `JWT_SECRET` and contain a `sub` claim representing the authenticated user's internal `id` (BigInt), serialized as a string.

#### Scenario: Valid token on guarded route
- **WHEN** a request arrives at a guarded route with `Authorization: Bearer <valid-token>`
- **THEN** the system returns `200 OK` and the handler receives the authenticated user's internal id (as a `bigint`) via `@CurrentUser()`

#### Scenario: Handler receives userId from token
- **WHEN** a guarded handler uses `@CurrentUser()` and the token payload contains `{ sub: "123" }`
- **THEN** `@CurrentUser()` returns `123n` (the `sub` claim parsed to a `bigint`)
