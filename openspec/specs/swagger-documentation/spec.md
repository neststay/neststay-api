# Spec: Swagger Documentation

## Purpose

Provides interactive API documentation via Swagger UI, available only in non-production environments. Defines shared decorators and DTOs that standardise how success envelopes and error responses are documented across the codebase.

## Requirements

### Requirement: Swagger UI mounted in development only
The application SHALL mount Swagger UI at `/docs` when `APP_ENV` is not `'production'`. The gate SHALL be evaluated by reading `APP_ENV` from `ConfigService` after the NestJS application is created. In production (`APP_ENV=production`) no `/docs` route SHALL exist.

#### Scenario: Swagger accessible in development
- **WHEN** `APP_ENV` is set to `development` and the application starts
- **THEN** a GET request to `/docs` returns a 200 response with the Swagger UI HTML

#### Scenario: Swagger not mounted in production
- **WHEN** `APP_ENV` is set to `production` and the application starts
- **THEN** a GET request to `/docs` returns a 404 (no route registered)

#### Scenario: Swagger document metadata
- **WHEN** Swagger UI loads
- **THEN** the document title is `Rynox API`, the description is `API documentation for Rynox`, and the version is `1.0`

---

### Requirement: ResponseApiDto success envelope DTO
The system SHALL provide a generic `ResponseApiDto<T>` class in `src/common/swagger/` with three fields: `success` (boolean), `message` (string), and `data` (typed payload `T`). All three fields SHALL be annotated with `@ApiProperty()` and include realistic example values.

#### Scenario: Envelope shape exposed in Swagger schema
- **WHEN** a controller uses `@ApiEnvelopeResponse()` with a concrete `dataType`
- **THEN** the Swagger schema for that response shows `success`, `message`, and a fully typed `data` object (not an opaque `object`)

---

### Requirement: ApiEnvelopeResponse decorator
The system SHALL provide an `ApiEnvelopeResponse(status, description, dataType)` decorator in `src/common/swagger/` that documents a success response using the `ResponseApiDto` envelope with a typed `data` field via OpenAPI `allOf` + `$ref`.

#### Scenario: Typed data schema rendered in Swagger UI
- **WHEN** `@ApiEnvelopeResponse(201, 'Created', SomeResponseDto)` is applied to a handler
- **THEN** the Swagger UI renders a 201 response schema where `data` references `SomeResponseDto`'s schema (not `object`)

---

### Requirement: ApiHttpErrorResponse decorator
The system SHALL provide an `ApiHttpErrorResponse(status, description, messageExample)` decorator that documents an error response with the NestJS default shape: `{ statusCode: number, message: string }`.

#### Scenario: Error response schema in Swagger UI
- **WHEN** `@ApiHttpErrorResponse(409, 'Email already in use', 'email already registered')` is applied
- **THEN** the Swagger UI renders a 409 response schema with `statusCode` (number, example 409) and `message` (string, example `'email already registered'`)

---

### Requirement: ApiConflictWithMessage convenience decorator
The system SHALL provide an `ApiConflictWithMessage(description, message)` decorator that wraps `ApiHttpErrorResponse` for HTTP 409 responses.

#### Scenario: Conflict decorator produces correct status code
- **WHEN** `@ApiConflictWithMessage('Duplicate email', 'email already registered')` is applied
- **THEN** the Swagger UI renders a 409 response (not any other status code)

---

### Requirement: GET / documented in Swagger
The `GET /` endpoint SHALL be annotated with `@ApiTags('App')`, `@ApiOperation({ summary: 'Health check' })`, and an explicit `@ApiResponse({ status: 200, schema: { type: 'string' }, example: 'Hello World!' })`. The runtime behaviour of the endpoint SHALL NOT change.

#### Scenario: Root endpoint visible in Swagger UI
- **WHEN** Swagger UI loads
- **THEN** the `GET /` endpoint is listed under the `App` tag with a summary and a documented 200 string response

---

### Requirement: DTO fields annotated with @ApiProperty
Any DTO class referenced in a Swagger schema SHALL have every field annotated with `@ApiProperty()` (or `@ApiPropertyOptional()` for optional fields) including `description`, `example`, and the correct OpenAPI type.

#### Scenario: No opaque object schemas from missing @ApiProperty
- **WHEN** Swagger UI renders a response or request schema referencing a DTO
- **THEN** all fields of that DTO are visible with their types and examples (no fields rendered as `object` due to missing decorator)
