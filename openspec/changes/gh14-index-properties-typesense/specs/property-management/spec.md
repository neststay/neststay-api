## MODIFIED Requirements

### Requirement: Create property
An authenticated user SHALL be able to create a property. The created property's `hostId` MUST be set from the authenticated user's id, never from client-supplied input. Creating a property SHALL emit a `property.created` domain event carrying the property's `slug`.

#### Scenario: Successful creation
- **WHEN** an authenticated user submits valid property data (locationId, placeTypeId, nightlyRate, name, description, numberOfGuests, numberOfBedrooms, numberOfBathrooms)
- **THEN** the system creates the property with `hostId` set to the authenticated user's id and returns the property addressed by its `slug`

#### Scenario: Unauthenticated create attempt
- **WHEN** an unauthenticated request attempts to create a property
- **THEN** the system rejects the request with 401 Unauthorized

#### Scenario: Invalid payload
- **WHEN** an authenticated user submits a payload missing a required field or with an invalid value
- **THEN** the system rejects the request with 422 Unprocessable Entity

#### Scenario: Property creation emits a domain event
- **WHEN** a property is successfully created
- **THEN** the system emits a `property.created` event containing the created property's `slug`
- **AND** the creation request completes successfully regardless of whether any listener for that event succeeds
