## MODIFIED Requirements

### Requirement: User model has the required fields
The system SHALL define a Prisma `User` model with: `id` (BigInt, primary key, auto-increment), `slug` (String, unique, required — the public-facing identifier), `name` (String, optional), `email` (String, unique, required), `password` (String, required), `emailVerifiedAt` (DateTime, nullable, default `null`), `lastLoggedIn` (DateTime, nullable), `createdAt` (DateTime, default now), `updatedAt` (DateTime, auto-updated).

#### Scenario: New user row is created
- **WHEN** a new user record is inserted
- **THEN** the `users` table row SHALL have `id` assigned by the database as the next auto-increment value, `slug` set to a ULID string, `createdAt` set to the current timestamp, `updatedAt` set to the current timestamp, `lastLoggedIn` set to `NULL`, and `emailVerifiedAt` set to `NULL`

#### Scenario: Email uniqueness is enforced at DB level
- **WHEN** an insert is attempted with an email that already exists
- **THEN** the database SHALL raise a unique constraint violation

#### Scenario: Slug uniqueness is enforced at DB level
- **WHEN** an insert is attempted with a `slug` that already exists
- **THEN** the database SHALL raise a unique constraint violation

### Requirement: IDs are application-generated ULIDs
The system SHALL generate `slug` values using the `ulid` npm package in `UserRepository.create()` before calling Prisma, not via a DB default or Prisma schema default. The `id` field SHALL be assigned by the database via auto-increment and SHALL NOT be set by application code.

#### Scenario: User is created
- **WHEN** `UserRepository.create()` is called
- **THEN** the resulting `slug` SHALL be a valid ULID string (26 characters, Crockford Base32) assigned by the application
- **AND** the resulting `id` SHALL be a bigint assigned by the database, not by application code

### Requirement: UserRepository provides CRUD operations
The system SHALL provide a `UserRepository` class with methods: `findById` (internal bigint id, for use by other repositories/services needing the FK value), `findBySlug` (public ulid slug, for user-facing lookups), `findByEmail`, `findAll`, `create`, `updateBySlug`, `deleteBySlug`. All methods SHALL use object-argument signatures. No direct Prisma calls SHALL exist outside of repository classes.

#### Scenario: Find user by internal id
- **WHEN** `UserRepository.findById({ id })` is called with an existing bigint id
- **THEN** the method SHALL return the matching user record or `null` if not found

#### Scenario: Find user by slug
- **WHEN** `UserRepository.findBySlug({ slug })` is called with an existing slug
- **THEN** the method SHALL return the matching user record or `null` if not found

#### Scenario: Find user by email
- **WHEN** `UserRepository.findByEmail({ email })` is called
- **THEN** the method SHALL return the matching user record or `null` if not found

#### Scenario: Create user
- **WHEN** `UserRepository.create({ data })` is called
- **THEN** the method SHALL insert a new row and return the created user record

#### Scenario: Update user by slug
- **WHEN** `UserRepository.updateBySlug({ slug, data })` is called
- **THEN** the method SHALL update the specified fields on the user matching that slug and return the updated user record

#### Scenario: Delete user by slug
- **WHEN** `UserRepository.deleteBySlug({ slug })` is called
- **THEN** the method SHALL remove the user record matching that slug from the database

### Requirement: UserService returns DTOs, not raw Prisma types
The system SHALL ensure `UserService` methods return typed DTO objects. Prisma model types SHALL NOT be exposed outside the repository layer. Response DTOs SHALL exclude the `password` field and SHALL expose `slug` in place of the internal `id` — the internal bigint `id` SHALL NOT appear in any response DTO.

#### Scenario: Service returns user data
- **WHEN** any `UserService` method returns user data
- **THEN** the returned object SHALL be a DTO instance with `password` omitted and `id` replaced by `slug`
