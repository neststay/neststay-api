## ADDED Requirements

### Requirement: Seed script populates Indian locations
The system SHALL seed a fixed list of Indian city `Location` rows (e.g. Mumbai, Delhi, Bengaluru, Goa, Jaipur, Udaipur, Kochi, Manali, Rishikesh, Pondicherry) via `createMany` with `skipDuplicates: true`, matched by `name`.

#### Scenario: First seed run creates locations
- **WHEN** `npm run prisma:seed` is executed against a clean migrated database
- **THEN** a `Location` record SHALL exist for each seeded Indian city name

#### Scenario: Re-running seed does not duplicate locations
- **WHEN** `npm run prisma:seed` is executed a second time
- **THEN** the seed SHALL complete without errors and SHALL NOT create duplicate `Location` rows for the same city name

### Requirement: Seed script populates place types
The system SHALL seed a fixed list of `PlaceType` rows (e.g. Apartment, Villa, House, Cottage, Farmhouse, Resort, Guesthouse, Homestay) via `createMany` with `skipDuplicates: true`, matched by `name`.

#### Scenario: First seed run creates place types
- **WHEN** `npm run prisma:seed` is executed against a clean migrated database
- **THEN** a `PlaceType` record SHALL exist for each seeded place type name

#### Scenario: Re-running seed does not duplicate place types
- **WHEN** `npm run prisma:seed` is executed a second time
- **THEN** the seed SHALL complete without errors and SHALL NOT create duplicate `PlaceType` rows for the same name

### Requirement: Seed script populates fake properties using Faker
The system SHALL generate fake `Property` rows using `@faker-js/faker`, each assigned a random `locationId` and `placeTypeId` drawn from the seeded `Location`/`PlaceType` rows and a random `hostId` drawn from seeded `User` rows. Each property SHALL receive a unique ulid-based `slug`, consistent with `PropertyRepository.create`'s id-generation pattern. The count SHALL be configurable via the `SEED_PROPERTY_COUNT` environment variable (default 10).

#### Scenario: Fake properties created on first run
- **WHEN** `npm run prisma:seed` is executed against a clean migrated database
- **THEN** at least `SEED_PROPERTY_COUNT` `Property` records SHALL exist, each with a valid `locationId`, `placeTypeId`, and `hostId` referencing seeded rows

#### Scenario: Properties seed after their dependencies
- **WHEN** the seed script runs `seedProperties`
- **THEN** `seedLocations`, `seedPlaceTypes`, and `seedUsers` SHALL already have completed, so every generated `locationId`, `placeTypeId`, and `hostId` resolves to an existing row

#### Scenario: Re-running seed does not fail on duplicate properties
- **WHEN** `npm run prisma:seed` is executed after a prior run
- **THEN** the seed SHALL complete without errors, generating additional `Property` rows with newly generated unique `slug`s

### Requirement: Seed env vars are documented in .env.example
The system SHALL document `SEED_PROPERTY_COUNT` in `.env.example` with a placeholder value, following the existing `SEED_USER_COUNT` convention.

#### Scenario: Developer clones the repo
- **WHEN** a developer inspects `.env.example`
- **THEN** it SHALL contain a placeholder entry for `SEED_PROPERTY_COUNT`
