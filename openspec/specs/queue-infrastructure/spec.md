# Queue Infrastructure

## Purpose

Defines requirements for BullMQ queue infrastructure: global QueueModule, Redis connection, typed job enqueueing, user-register processor, job retry/retention defaults, Bull Board dashboard, and environment variable documentation.

## Requirements

### Requirement: QueueModule is globally injectable
The system SHALL provide a `@Global()` NestJS `QueueModule` that exports `QueueProducerService`, making it injectable in any module without re-importing `QueueModule`.

#### Scenario: Injecting QueueProducerService without re-importing QueueModule
- **WHEN** a feature module injects `QueueProducerService` in its constructor
- **THEN** NestJS resolves the dependency without requiring `QueueModule` in the feature module's imports array

### Requirement: BullMQ connects via REDIS_QUEUE_URL
The system SHALL configure BullMQ's Redis connection using `REDIS_QUEUE_URL`. The queue connection MUST be independent of the cache `REDIS_URL` connection.

#### Scenario: Application starts with REDIS_QUEUE_URL configured
- **WHEN** the application starts with a valid `REDIS_QUEUE_URL` environment variable
- **THEN** BullMQ establishes a connection to Redis using that URL

#### Scenario: Application starts without REDIS_QUEUE_URL
- **WHEN** the application starts without `REDIS_QUEUE_URL` set
- **THEN** the application fails to start or enqueue calls fail with a clear error (no silent no-op)

### Requirement: QueueProducerService provides a typed enqueueUserRegister method
The system SHALL expose `enqueueUserRegister({ payload })` on `QueueProducerService` that accepts a `UserRegisterJobPayload` and adds a `user.register` job to the `user-events` queue.

#### Scenario: Successful enqueue
- **WHEN** `enqueueUserRegister` is called with a valid `UserRegisterJobPayload`
- **THEN** a `user.register` job is added to the `user-events` BullMQ queue with the provided payload

#### Scenario: Redis unavailable during enqueue
- **WHEN** `enqueueUserRegister` is called and Redis/BullMQ is unreachable
- **THEN** the method throws an error (fail fast — no silent no-op)

### Requirement: UserRegisterJobPayload excludes sensitive fields
The `UserRegisterJobPayload` type SHALL include `userId` (string), `email` (string), and `name` (string or null). It SHALL NOT include `password` or other sensitive fields.

#### Scenario: Job payload does not contain password
- **WHEN** a `user.register` job is enqueued after user registration
- **THEN** the job data stored in Redis MUST NOT contain a `password` field

### Requirement: user-register processor handles jobs and logs payload
The system SHALL provide a BullMQ `WorkerHost` processor for the `user-events` queue that handles `user.register` jobs by logging the payload as a structured log entry.

#### Scenario: Job is processed successfully
- **WHEN** a `user.register` job is dequeued from `user-events`
- **THEN** the processor logs a structured message containing `userId` and `email` from the job payload
- **AND** the job completes without error

### Requirement: Default job options apply retries and retention
The system SHALL configure `user.register` jobs with `attempts: 3`, exponential backoff starting at 1 second, `removeOnComplete: { count: 100 }`, and `removeOnFail: false`.

#### Scenario: Failed job is retried up to 3 times
- **WHEN** a `user.register` job processor throws an error
- **THEN** BullMQ retries the job up to 3 times with exponential backoff before marking it failed

#### Scenario: Completed jobs are retained for debugging
- **WHEN** a `user.register` job completes successfully
- **THEN** the job remains in the completed set (up to the last 100 entries) for Bull Board inspection

### Requirement: Bull Board is mounted at /admin/queues in non-production environments
The system SHALL mount the Bull Board dashboard at `/admin/queues` when `NODE_ENV !== 'production'` or `ENABLE_BULL_BOARD=true`. The dashboard MUST NOT be reachable when `NODE_ENV=production` and `ENABLE_BULL_BOARD` is unset or false.

#### Scenario: Bull Board accessible in development
- **WHEN** the application runs with `NODE_ENV=development`
- **THEN** `GET /admin/queues` returns a 200 response with the Bull Board UI

#### Scenario: Bull Board accessible when explicitly enabled
- **WHEN** the application runs with `NODE_ENV=production` and `ENABLE_BULL_BOARD=true`
- **THEN** `GET /admin/queues` returns a 200 response with the Bull Board UI

#### Scenario: Bull Board not mounted in production by default
- **WHEN** the application runs with `NODE_ENV=production` and `ENABLE_BULL_BOARD` is unset or false
- **THEN** `GET /admin/queues` returns 404 (route does not exist)

### Requirement: Queue environment variables are documented in .env.example
The system SHALL include `REDIS_QUEUE_URL`, `REDIS_QUEUE_PREFIX`, and `ENABLE_BULL_BOARD` in `.env.example` with example values.

#### Scenario: .env.example contains queue configuration
- **WHEN** a developer reads `.env.example`
- **THEN** they find `REDIS_QUEUE_URL`, `REDIS_QUEUE_PREFIX`, and `ENABLE_BULL_BOARD` with example values and comments
