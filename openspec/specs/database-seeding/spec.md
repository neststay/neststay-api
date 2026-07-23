# Database Seeding

## Purpose

Defines requirements for the database seed script that populates dev databases with realistic test data, enabling developers to test features immediately after database setup.

## Requirements

### Requirement: Seed script populates a fixed admin user
The system SHALL provide a seed script (`prisma/seed.ts`) that creates or updates a dev admin user whose credentials are sourced from environment variables (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`). The admin user's password SHALL be stored as a bcrypt hash (≥10 salt rounds) and the `id` SHALL be a ULID.

#### Scenario: First seed run creates admin user
- **WHEN** `npm run prisma:seed` is executed against a clean migrated database
- **THEN** a user record SHALL exist with email equal to `SEED_ADMIN_EMAIL` and a bcrypt-hashed password

#### Scenario: Re-running seed does not duplicate admin user
- **WHEN** `npm run prisma:seed` is executed a second time
- **THEN** the seed SHALL complete without errors and SHALL NOT create a second user with the same email

### Requirement: Seed script populates fake users using Faker
The system SHALL generate 10 fake users using `@faker-js/faker` with unique emails, ULID ids, and bcrypt-hashed passwords. The count SHALL be configurable via the `SEED_USER_COUNT` environment variable (default 10).

#### Scenario: Fake users created on first run
- **WHEN** `npm run prisma:seed` is executed against a clean migrated database
- **THEN** at least 10 user records SHALL exist (excluding the admin) with Faker-generated names and unique emails

#### Scenario: Re-running seed skips duplicate fake users
- **WHEN** `npm run prisma:seed` is executed after a prior run
- **THEN** the seed SHALL complete without errors and SHALL NOT fail on duplicate email conflicts

### Requirement: Seed is invokable via npm script and Prisma CLI
The system SHALL expose seeding via `npm run prisma:seed` (which invokes `prisma db seed`) and via `npx prisma db seed` directly.

#### Scenario: Developer runs seed via npm script
- **WHEN** a developer runs `npm run prisma:seed`
- **THEN** `prisma db seed` SHALL execute and print a success message

#### Scenario: Developer runs seed via Prisma CLI
- **WHEN** a developer runs `npx prisma db seed`
- **THEN** the seed SHALL execute the `prisma/seed.ts` script via `npx tsx`

### Requirement: Seed script is extensible for future models
The system SHALL organise seed logic into named functions (e.g., `seedUsers()`) called from a `main()` entrypoint, so future model seeders can be added without modifying the Prisma configuration.

#### Scenario: Adding a future seed function
- **WHEN** a developer adds a `seedPosts()` function and calls it from `main()`
- **THEN** `npm run prisma:seed` SHALL execute both `seedUsers()` and `seedPosts()` without any changes to `prisma.config.ts`

### Requirement: Seed env vars are documented in .env.example
The system SHALL document `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and optional `SEED_USER_COUNT` / `SEED_USER_PASSWORD` in `.env.example` with placeholder values.

#### Scenario: Developer clones the repo
- **WHEN** a developer inspects `.env.example`
- **THEN** it SHALL contain placeholder entries for all seed-related environment variables
