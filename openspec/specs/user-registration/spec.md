# User Registration

## Purpose

Defines requirements for the `POST /users/register` endpoint: input validation, duplicate-email handling, password hashing, event emission, and the registration response.

## Requirements

### Requirement: Registration endpoint accepts and validates input
The system SHALL expose `POST /users/register` that accepts a JSON body with `name` (string, required, 1–255 characters), `email` (string, required, valid email format), and `password` (string, required, minimum 8 characters). Validation SHALL be performed via Zod at the controller boundary before any service call.

#### Scenario: Valid registration request
- **WHEN** `POST /users/register` is called with `{ name, email, password }` all satisfying their constraints
- **THEN** the controller SHALL pass the validated data to `UserService.register()`

#### Scenario: Password too short
- **WHEN** `POST /users/register` is called with a `password` shorter than 8 characters
- **THEN** the system SHALL return `422 Unprocessable Entity` with a validation error message identifying the `password` field

#### Scenario: Invalid email format
- **WHEN** `POST /users/register` is called with an `email` that is not a valid email address
- **THEN** the system SHALL return `422 Unprocessable Entity` with a validation error message identifying the `email` field

#### Scenario: Name too long
- **WHEN** `POST /users/register` is called with a `name` longer than 255 characters
- **THEN** the system SHALL return `422 Unprocessable Entity` with a validation error message identifying the `name` field

#### Scenario: Name is empty string
- **WHEN** `POST /users/register` is called with `name` set to an empty string
- **THEN** the system SHALL return `422 Unprocessable Entity` with a validation error message identifying the `name` field

### Requirement: Duplicate email returns 409 Conflict
The system SHALL check email uniqueness before creating a user. If the email already exists, `UserService.register()` SHALL throw a `ConflictException`.

#### Scenario: Email already registered
- **WHEN** `POST /users/register` is called with an `email` that belongs to an existing user
- **THEN** the system SHALL return `409 Conflict`

#### Scenario: Email is unique
- **WHEN** `POST /users/register` is called with an `email` that does not exist in the database
- **THEN** the system SHALL proceed to create the user

### Requirement: Registration creates a user with a hashed password and null emailVerifiedAt
The system SHALL invoke `UserRepository.create()` with a bcrypt-hashed password and `emailVerifiedAt` set to `null`. The `password` field stored in the database SHALL never contain plaintext.

#### Scenario: Successful registration persists user
- **WHEN** `POST /users/register` completes successfully
- **THEN** a row SHALL exist in the `users` table with `email_verified_at = NULL` and `password` stored as a bcrypt hash (not plaintext)

### Requirement: Successful registration emits user.register event
The system SHALL emit a `user.register` event via `EventEmitter2` after the user record is created. The event payload SHALL include the created user data. A registered `@OnEvent('user.register', { async: true })` listener SHALL enqueue a `user.register` BullMQ job on the `user-events` queue with a safe payload (`userId`, `email`, `name` — excluding `password`). The `userId` field in the enqueued job payload SHALL be the user's internal `id` (BigInt) serialized as a string, since BigInt values cannot be JSON-serialized directly. The listener MUST catch all enqueue errors and log them without rethrowing, so that a queue failure does not fail the HTTP registration response.

#### Scenario: Event emitted after registration
- **WHEN** `POST /users/register` completes successfully
- **THEN** the `user.register` event SHALL be emitted with the new user's data as payload

#### Scenario: Listener enqueues BullMQ job on event
- **WHEN** the `user.register` event is emitted
- **THEN** a `user.register` job SHALL be added to the `user-events` BullMQ queue with `userId` (the internal id as a string), `email`, and `name` (no `password`)

#### Scenario: Enqueue failure does not fail registration response
- **WHEN** `POST /users/register` completes successfully but the BullMQ enqueue throws
- **THEN** the HTTP response SHALL still return `201 Created`
- **AND** the error SHALL be logged at error level

### Requirement: Successful registration returns 201 with id and email
The system SHALL return HTTP `201 Created` with a `ResponseApiDto` envelope where `data` contains only `{ slug, email }`. The internal `id` SHALL NOT appear in the response body.

#### Scenario: Registration success response
- **WHEN** `POST /users/register` completes successfully
- **THEN** the response status SHALL be `201 Created`
- **AND** the response body SHALL match `{ success: true, message: <string>, data: { slug: <string>, email: <string> } }`
- **AND** the `data` object SHALL NOT include `password`, `id`, `name`, `createdAt`, or `updatedAt`
