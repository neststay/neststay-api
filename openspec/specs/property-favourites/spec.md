# Property Favourites

## Purpose

Defines requirements for authenticated users to mark properties as favourites, including toggling favourite status and ensuring favourite records stay consistent with users and properties.

## Requirements

### Requirement: Toggle a property's favourite status
The system SHALL provide an authenticated `POST /properties/:slug/favourite` endpoint, with no request body, that toggles whether the current user has favourited the property identified by `:slug`. If no favourite record exists for the (user, property) pair it SHALL be created; if one exists it SHALL be deleted.

#### Scenario: Favouriting a property for the first time
- **WHEN** an authenticated user calls `POST /properties/:slug/favourite` for a property they have not favourited
- **THEN** the system creates a favourite record for that user and property, and responds `200` with `{ success: true, message: "Property added to favourites", data: { slug, isFavourite: true } }`

#### Scenario: Unfavouriting a previously favourited property
- **WHEN** an authenticated user calls `POST /properties/:slug/favourite` for a property they have already favourited
- **THEN** the system deletes the existing favourite record for that user and property, and responds `200` with `{ success: true, message: "Property removed from favourites", data: { slug, isFavourite: false } }`

#### Scenario: Favouriting a non-existent property
- **WHEN** a user calls `POST /properties/:slug/favourite` with a `:slug` that does not match any property
- **THEN** the system responds `404 Not Found` and no favourite record is created

#### Scenario: Unauthenticated request
- **WHEN** a request to `POST /properties/:slug/favourite` is made without a valid bearer token
- **THEN** the system responds `401 Unauthorized` and no favourite record is created or deleted

#### Scenario: A host can favourite their own property
- **WHEN** a user who hosts the property calls `POST /properties/:slug/favourite` on their own listing
- **THEN** the system toggles the favourite the same as it would for any other authenticated user, with no ownership restriction applied

### Requirement: A user cannot have duplicate favourite records for the same property
The system SHALL enforce, at the database level, that at most one favourite record can exist for a given (user, property) pair at any time.

#### Scenario: Duplicate favourite creation is prevented
- **WHEN** two concurrent `POST /properties/:slug/favourite` requests from the same authenticated user both attempt to create a favourite record for a property that is not yet favourited
- **THEN** only one favourite record ever exists for that (user, property) pair once both requests complete

### Requirement: Favourite records are removed when their user or property is deleted
The system SHALL cascade-delete a favourite record when either the user or the property it references is deleted.

#### Scenario: Property deletion cascades to favourites
- **WHEN** a property that has been favourited by one or more users is deleted
- **THEN** all favourite records referencing that property are also deleted

#### Scenario: User deletion cascades to favourites
- **WHEN** a user who has favourited one or more properties is deleted
- **THEN** all favourite records belonging to that user are also deleted
