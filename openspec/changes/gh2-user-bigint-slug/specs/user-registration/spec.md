## MODIFIED Requirements

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
