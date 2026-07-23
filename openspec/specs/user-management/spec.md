# User Management

## Purpose

Defines requirements for the User data model, ULID-based ID generation, bcrypt password hashing, the repository/service layer, and module wiring.
## Requirements
### Requirement: User model has the required fields
The system SHALL define a Prisma `User` model with: `id` (String, primary key), `name` (String, optional), `email` (String, unique, required), `password` (String, required), `emailVerifiedAt` (DateTime, nullable, default `null`), `lastLoggedIn` (DateTime, nullable), `createdAt` (DateTime, default now), `updatedAt` (DateTime, auto-updated).

#### Scenario: New user row is created
- **WHEN** a new user record is inserted
- **THEN** the `users` table row SHALL have `id` set to a ULID string, `createdAt` set to the current timestamp, `updatedAt` set to the current timestamp, `lastLoggedIn` set to `NULL`, and `emailVerifiedAt` set to `NULL`

#### Scenario: Email uniqueness is enforced at DB level
- **WHEN** an insert is attempted with an email that already exists
- **THEN** the database SHALL raise a unique constraint violation

### Requirement: IDs are application-generated ULIDs
The system SHALL generate `id` values using the `ulid` npm package in `UserRepository.create()` before calling Prisma, not via a DB default or Prisma schema default.

#### Scenario: User is created
- **WHEN** `UserRepository.create()` is called
- **THEN** the resulting `id` SHALL be a valid ULID string (26 characters, Crockford Base32)
- **AND** the ID SHALL be assigned by the application, not by the database

### Requirement: Passwords are stored as bcrypt hashes
The system SHALL ensure that `UserService` hashes the plaintext password with bcrypt (minimum saltRounds=10) before passing the data to `UserRepository`. The `password` field in the database SHALL never contain plaintext.

#### Scenario: User is created with a password
- **WHEN** `UserService.create()` is called with a plaintext password
- **THEN** `UserRepository.create()` SHALL receive a bcrypt hash, not the plaintext

#### Scenario: User password is updated
- **WHEN** `UserService.update()` is called with a new `password` value
- **THEN** `UserRepository.update()` SHALL receive a bcrypt hash of the new password

#### Scenario: User update without password change
- **WHEN** `UserService.update()` is called without a `password` field
- **THEN** the stored password SHALL remain unchanged

### Requirement: UserRepository provides CRUD operations
The system SHALL provide a `UserRepository` class with methods: `findById`, `findByEmail`, `findAll`, `create`, `update`, `delete`. All methods SHALL use object-argument signatures. No direct Prisma calls SHALL exist outside of repository classes.

#### Scenario: Find user by ID
- **WHEN** `UserRepository.findById({ id })` is called with an existing ULID
- **THEN** the method SHALL return the matching user record or `null` if not found

#### Scenario: Find user by email
- **WHEN** `UserRepository.findByEmail({ email })` is called
- **THEN** the method SHALL return the matching user record or `null` if not found

#### Scenario: Create user
- **WHEN** `UserRepository.create({ data })` is called
- **THEN** the method SHALL insert a new row and return the created user record

#### Scenario: Update user
- **WHEN** `UserRepository.update({ id, data })` is called
- **THEN** the method SHALL update the specified fields and return the updated user record

#### Scenario: Delete user
- **WHEN** `UserRepository.delete({ id })` is called
- **THEN** the method SHALL remove the user record from the database

### Requirement: UserService returns DTOs, not raw Prisma types
The system SHALL ensure `UserService` methods return typed DTO objects. Prisma model types SHALL NOT be exposed outside the repository layer. Response DTOs SHALL exclude the `password` field.

#### Scenario: Service returns user data
- **WHEN** any `UserService` method returns user data
- **THEN** the returned object SHALL be a DTO instance with `password` omitted

### Requirement: UserModule is registered in AppModule
The system SHALL import both `PrismaModule` and `UserModule` in `AppModule` so that all providers are available to the NestJS dependency injection system.

#### Scenario: Application builds successfully
- **WHEN** `npm run build` is executed
- **THEN** the build SHALL complete without errors and all NestJS module dependencies SHALL resolve

### Requirement: UserRepository provides a paginated find-all method
The system SHALL add a `findAllPaginated({ page, limit }: { page: number; limit: number })` method to `UserRepository` that uses the extended Prisma client's `.paginate().withPages({ page, limit })` to return a `[User[], meta]` tuple. The existing `findAll` method SHALL remain unchanged.

#### Scenario: findAllPaginated returns rows and meta
- **WHEN** `UserRepository.findAllPaginated({ page: 1, limit: 10 })` is called
- **THEN** it SHALL return a tuple `[rows, meta]` where `rows` is an array of Prisma `User` objects and `meta` contains pagination metadata

#### Scenario: findAllPaginated respects page and limit
- **WHEN** `UserRepository.findAllPaginated({ page: 2, limit: 5 })` is called with 15 total users
- **THEN** `rows` SHALL contain 5 user objects corresponding to the second page

### Requirement: UserService exposes a paginated user list method returning a DTO
The system SHALL add a `findAllPaginated({ page, limit }: { page: number; limit: number })` method to `UserService` that calls `UserRepository.findAllPaginated`, maps each `User` to `UserResponseDto` (excluding `password`), and returns a `PaginatedResponseDto<UserResponseDto>` using `mapToPaginatedResponse`.

#### Scenario: Service returns paginated DTO without password
- **WHEN** `UserService.findAllPaginated({ page: 1, limit: 10 })` is called
- **THEN** it SHALL return a `PaginatedResponseDto<UserResponseDto>` where no item in `items` contains a `password` field and `meta` reflects the pagination state

