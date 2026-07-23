## Purpose

Defines the behaviour of the user login flow, including input validation, JWT issuance, credential error handling, and post-login side-effects (lastLoggedIn update and event emission).

---

## Requirements

### Requirement: Login endpoint accepts and validates input
The system SHALL expose `POST /users/login` that accepts a JSON body with `email` (string, required, valid email format) and `password` (string, required, minimum 1 character). Validation SHALL be performed via Zod at the controller boundary before any service call.

#### Scenario: Valid login request shape
- **WHEN** `POST /users/login` is called with a well-formed `{ email, password }` body
- **THEN** the controller SHALL pass the validated data to `UserService.login()`

#### Scenario: Missing email field
- **WHEN** `POST /users/login` is called without an `email` field
- **THEN** the system SHALL return `422 Unprocessable Entity` with a validation error message

#### Scenario: Invalid email format
- **WHEN** `POST /users/login` is called with an `email` that is not a valid email address
- **THEN** the system SHALL return `422 Unprocessable Entity` with a validation error message

#### Scenario: Missing password field
- **WHEN** `POST /users/login` is called without a `password` field
- **THEN** the system SHALL return `422 Unprocessable Entity` with a validation error message

---

### Requirement: Valid credentials return JWT and user info
On successful credential validation the system SHALL return `200 OK` with a `ResponseApiDto` envelope whose `data` field is `{ token, id, email }`, where `token` is a signed JWT bearer token.

#### Scenario: Successful login
- **WHEN** `POST /users/login` is called with an email that exists and a matching password
- **THEN** the system SHALL return `200 OK` with `{ success: true, message: ..., data: { token, id, email } }`

#### Scenario: Token is a non-empty string
- **WHEN** a successful login response is received
- **THEN** `data.token` SHALL be a non-empty string representing a signed JWT

---

### Requirement: JWT has 8-hour expiry
The issued JWT SHALL expire 8 hours after issuance. The expiry SHALL be configurable via `JWT_EXPIRES_IN` environment variable (default `8h`). The JWT SHALL be signed with the `JWT_SECRET` environment variable read via `ConfigService`.

#### Scenario: Token expiry claim is set
- **WHEN** the JWT payload is decoded
- **THEN** the `exp` claim SHALL correspond to the current time plus 8 hours (or the value of `JWT_EXPIRES_IN`)

#### Scenario: Missing JWT_SECRET causes startup failure
- **WHEN** the application starts without `JWT_SECRET` set in the environment
- **THEN** the application SHALL throw an error and refuse to start

---

### Requirement: Invalid credentials return generic 401
If the email is not found in the database OR the password does not match the stored bcrypt hash, the system SHALL return `401 Unauthorized` with the message `"Credentials doesn't match"`. The response SHALL NOT indicate which field caused the failure.

#### Scenario: Email not found
- **WHEN** `POST /users/login` is called with an email that does not exist in the database
- **THEN** the system SHALL return `401 Unauthorized` with message `"Credentials doesn't match"`

#### Scenario: Wrong password
- **WHEN** `POST /users/login` is called with a registered email and an incorrect password
- **THEN** the system SHALL return `401 Unauthorized` with message `"Credentials doesn't match"`

#### Scenario: Error message is identical for both failure cases
- **WHEN** comparing the `message` field from a not-found-email response and a wrong-password response
- **THEN** both SHALL be exactly `"Credentials doesn't match"` — no difference that reveals which field failed

---

### Requirement: lastLoggedIn is updated on successful login
On successful login the system SHALL update the authenticated user's `lastLoggedIn` field in the database to the current UTC timestamp via `UserRepository.updateLastLoggedIn()`.

#### Scenario: lastLoggedIn updated after login
- **WHEN** `POST /users/login` succeeds for a user
- **THEN** the user's `lastLoggedIn` column in the database SHALL be set to the current timestamp

#### Scenario: lastLoggedIn not updated on failed login
- **WHEN** `POST /users/login` returns `401`
- **THEN** the user's `lastLoggedIn` value in the database SHALL remain unchanged

---

### Requirement: user.loggedin event is emitted on successful login
On successful login the system SHALL emit a `user.loggedin` event via `EventEmitter2` with payload `{ userId }`. The event SHALL be emitted after the JWT is generated and after `lastLoggedIn` is updated.

#### Scenario: Event emitted on success
- **WHEN** `POST /users/login` succeeds
- **THEN** a `user.loggedin` event SHALL be emitted with payload `{ userId: <the authenticated user's id> }`

#### Scenario: Event not emitted on failure
- **WHEN** `POST /users/login` returns `401`
- **THEN** no `user.loggedin` event SHALL be emitted
