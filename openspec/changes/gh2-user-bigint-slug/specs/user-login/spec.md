## MODIFIED Requirements

### Requirement: Valid credentials return JWT and user info
On successful credential validation the system SHALL return `200 OK` with a `ResponseApiDto` envelope whose `data` field is `{ token, slug, email }`, where `token` is a signed JWT bearer token whose `sub` claim is the authenticated user's internal `id` (BigInt) serialized as a string. The internal `id` SHALL NOT appear in the response body.

#### Scenario: Successful login
- **WHEN** `POST /users/login` is called with an email that exists and a matching password
- **THEN** the system SHALL return `200 OK` with `{ success: true, message: ..., data: { token, slug, email } }`

#### Scenario: Token is a non-empty string
- **WHEN** a successful login response is received
- **THEN** `data.token` SHALL be a non-empty string representing a signed JWT

#### Scenario: JWT sub claim carries the internal id as a string
- **WHEN** a successful login response's JWT is decoded
- **THEN** the `sub` claim SHALL equal the authenticated user's internal `id` converted to a string
