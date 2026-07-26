## MODIFIED Requirements

### Requirement: Seed script populates a fixed admin user
The system SHALL provide a seed script (`prisma/seed.ts`) that creates or updates a dev admin user whose credentials are sourced from environment variables (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`). The admin user's password SHALL be stored as a bcrypt hash (≥10 salt rounds) and the `slug` SHALL be a ULID. The `id` SHALL be assigned by the database.

#### Scenario: First seed run creates admin user
- **WHEN** `npm run prisma:seed` is executed against a clean migrated database
- **THEN** a user record SHALL exist with email equal to `SEED_ADMIN_EMAIL`, a bcrypt-hashed password, and a ULID `slug`

#### Scenario: Re-running seed does not duplicate admin user
- **WHEN** `npm run prisma:seed` is executed a second time
- **THEN** the seed SHALL complete without errors and SHALL NOT create a second user with the same email

### Requirement: Seed script populates fake users using Faker
The system SHALL generate 10 fake users using `@faker-js/faker` with unique emails, ULID `slug` values, and bcrypt-hashed passwords. The count SHALL be configurable via the `SEED_USER_COUNT` environment variable (default 10).

#### Scenario: Fake users created on first run
- **WHEN** `npm run prisma:seed` is executed against a clean migrated database
- **THEN** at least 10 user records SHALL exist (excluding the admin) with Faker-generated names, unique emails, and ULID `slug` values

#### Scenario: Re-running seed skips duplicate fake users
- **WHEN** `npm run prisma:seed` is executed after a prior run
- **THEN** the seed SHALL complete without errors and SHALL NOT fail on duplicate email conflicts
