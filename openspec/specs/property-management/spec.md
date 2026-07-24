# Property Management

## Purpose

Defines requirements for creating, retrieving, listing, updating, and deleting properties within the property module.

## Requirements

### Requirement: Create property
An authenticated user SHALL be able to create a property. The created property's `hostId` MUST be set from the authenticated user's id, never from client-supplied input.

#### Scenario: Successful creation
- **WHEN** an authenticated user submits valid property data (locationId, placeTypeId, nightlyRate, name, description, numberOfGuests, numberOfBedrooms, numberOfBathrooms)
- **THEN** the system creates the property with `hostId` set to the authenticated user's id and returns the property addressed by its `slug`

#### Scenario: Unauthenticated create attempt
- **WHEN** an unauthenticated request attempts to create a property
- **THEN** the system rejects the request with 401 Unauthorized

#### Scenario: Invalid payload
- **WHEN** an authenticated user submits a payload missing a required field or with an invalid value
- **THEN** the system rejects the request with 422 Unprocessable Entity

### Requirement: Retrieve a single property by slug
The system SHALL allow any caller to retrieve a single property using its public `slug`. The internal `id` SHALL NOT be exposed in the response.

#### Scenario: Property exists
- **WHEN** a caller requests a property by a `slug` that exists
- **THEN** the system returns the property's details without an `id` field

#### Scenario: Property does not exist
- **WHEN** a caller requests a property by a `slug` that does not exist
- **THEN** the system returns 404 Not Found

### Requirement: List properties for a location
The system SHALL allow any caller to list properties scoped to a required `locationId`, paginated.

#### Scenario: Properties exist for the location
- **WHEN** a caller requests the property list with a valid `locationId` and pagination parameters
- **THEN** the system returns a paginated list of properties belonging to that location

#### Scenario: Missing locationId
- **WHEN** a caller requests the property list without a `locationId`
- **THEN** the system rejects the request with 422 Unprocessable Entity

### Requirement: Update a property
An authenticated user SHALL be able to update only properties they own, addressed by `slug`. Ownership SHALL NOT be revealed to non-owners: a non-owner's attempt is indistinguishable from the slug not existing.

#### Scenario: Owner updates their property
- **WHEN** the authenticated user's id matches the property's `hostId`
- **THEN** the system applies the update and returns the updated property

#### Scenario: Non-owner attempts update
- **WHEN** the authenticated user's id does not match the property's `hostId`
- **THEN** the system returns 404 Not Found, identical to the response for a non-existent slug

#### Scenario: Property does not exist
- **WHEN** an authenticated user attempts to update a `slug` that does not exist
- **THEN** the system returns 404 Not Found

### Requirement: Delete a property
An authenticated user SHALL be able to delete only properties they own, addressed by `slug`. Ownership SHALL NOT be revealed to non-owners: a non-owner's attempt is indistinguishable from the slug not existing.

#### Scenario: Owner deletes their property
- **WHEN** the authenticated user's id matches the property's `hostId`
- **THEN** the system deletes the property

#### Scenario: Non-owner attempts deletion
- **WHEN** the authenticated user's id does not match the property's `hostId`
- **THEN** the system returns 404 Not Found, identical to the response for a non-existent slug

#### Scenario: Property does not exist
- **WHEN** an authenticated user attempts to delete a `slug` that does not exist
- **THEN** the system returns 404 Not Found
