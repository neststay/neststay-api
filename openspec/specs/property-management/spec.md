# Property Management

## Purpose

Defines requirements for creating, retrieving, listing, updating, and deleting properties within the property module.

## Requirements

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

### Requirement: Retrieve a single property by slug
The system SHALL allow any caller to retrieve a single property using its public `slug`, regardless of whether the property is active or inactive. The internal `id` SHALL NOT be exposed in the response. The response SHALL include the property's images, embedded via relation and ordered by `order` ascending, so no additional API call is required to obtain them. The response SHALL include an `isActive` boolean so callers can distinguish an active property from one that currently exists but is unavailable.

#### Scenario: Property exists and is active
- **WHEN** a caller requests a property by a `slug` that exists and is active
- **THEN** the system returns the property's details without an `id` field, including its images ordered by `order` and `isActive: true`

#### Scenario: Property exists but is inactive
- **WHEN** a caller requests a property by a `slug` that exists but is currently inactive
- **THEN** the system returns 200 with the property's details and `isActive: false`, not a 404

#### Scenario: Property has no images
- **WHEN** a caller requests a property by a `slug` that has no images
- **THEN** the system returns the property's details with an empty `images` list

#### Scenario: Property does not exist
- **WHEN** a caller requests a property by a `slug` that does not exist
- **THEN** the system returns 404 Not Found

### Requirement: List properties for a location
The system SHALL allow any caller to list properties scoped to a required `locationId`, paginated, returning only properties where `isActive` is `true`. Each property in the list SHALL include its images, embedded via relation and ordered by `order` ascending, so no additional API call per property is required. Each property SHALL also include an `isFavourited` boolean computed against the requesting user: `true` if the requesting user has favourited that property, `false` otherwise (including when the caller is unauthenticated). The favourite check MUST be resolved via a batched relation on the same paginated query (no additional query per property).

#### Scenario: Properties exist for the location
- **WHEN** a caller requests the property list with a valid `locationId` and pagination parameters
- **THEN** the system returns a paginated list of active properties belonging to that location, each including its images ordered by `order` and an `isFavourited` boolean

#### Scenario: Inactive properties are excluded from the list
- **WHEN** a location has both active and inactive properties
- **THEN** the system's response only includes properties where `isActive` is `true`

#### Scenario: Missing locationId
- **WHEN** a caller requests the property list without a `locationId`
- **THEN** the system rejects the request with 422 Unprocessable Entity

#### Scenario: Authenticated caller has favourited some listed properties
- **WHEN** an authenticated user requests the property list and has previously favourited some of the returned properties
- **THEN** the system returns `isFavourited: true` for those properties and `isFavourited: false` for the rest

#### Scenario: Unauthenticated caller
- **WHEN** an unauthenticated (anonymous) caller requests the property list
- **THEN** the system returns the list successfully with `isFavourited: false` for every property

#### Scenario: Authenticated caller sees only their own favourite state
- **WHEN** two different authenticated users, one of whom has favourited a property and one who has not, each request the property list
- **THEN** each user's response reflects only their own favourite state for that property

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
An authenticated user SHALL be able to delete only properties they own, addressed by `slug`. Ownership SHALL NOT be revealed to non-owners: a non-owner's attempt is indistinguishable from the slug not existing. Deleting a property SHALL also delete all images belonging to it.

#### Scenario: Owner deletes their property
- **WHEN** the authenticated user's id matches the property's `hostId`
- **THEN** the system deletes the property

#### Scenario: Non-owner attempts deletion
- **WHEN** the authenticated user's id does not match the property's `hostId`
- **THEN** the system returns 404 Not Found, identical to the response for a non-existent slug

#### Scenario: Property does not exist
- **WHEN** an authenticated user attempts to delete a `slug` that does not exist
- **THEN** the system returns 404 Not Found

#### Scenario: Deleting a property removes its images
- **WHEN** the authenticated owner deletes a property that has one or more images
- **THEN** the system deletes the property and all of its images

### Requirement: Activate a property
An authenticated user SHALL be able to activate only properties they own, addressed by `slug`, via `POST /properties/:slug/activate`. Ownership SHALL NOT be revealed to non-owners: a non-owner's attempt is indistinguishable from the slug not existing. Activating a property SHALL emit a `property.activated` domain event carrying the property's `slug`, regardless of whether the property was already active.

#### Scenario: Owner activates their inactive property
- **WHEN** the authenticated user's id matches the property's `hostId` and the property is currently inactive
- **THEN** the system sets `isActive` to `true` and returns the updated property

#### Scenario: Owner activates an already-active property
- **WHEN** the authenticated user's id matches the property's `hostId` and the property is already active
- **THEN** the system returns the property with `isActive: true` without error

#### Scenario: Non-owner attempts activation
- **WHEN** the authenticated user's id does not match the property's `hostId`
- **THEN** the system returns 404 Not Found, identical to the response for a non-existent slug

#### Scenario: Property does not exist
- **WHEN** an authenticated user attempts to activate a `slug` that does not exist
- **THEN** the system returns 404 Not Found

#### Scenario: Unauthenticated activation attempt
- **WHEN** an unauthenticated request attempts to activate a property
- **THEN** the system rejects the request with 401 Unauthorized

#### Scenario: Activation emits a domain event
- **WHEN** a property is successfully activated
- **THEN** the system emits a `property.activated` event containing the property's `slug`
- **AND** the request completes successfully regardless of whether any listener for that event succeeds

### Requirement: Deactivate a property
An authenticated user SHALL be able to deactivate only properties they own, addressed by `slug`, via `POST /properties/:slug/deactivate`. Ownership SHALL NOT be revealed to non-owners: a non-owner's attempt is indistinguishable from the slug not existing. Deactivating a property SHALL emit a `property.deactivated` domain event carrying the property's `slug`, regardless of whether the property was already inactive.

#### Scenario: Owner deactivates their active property
- **WHEN** the authenticated user's id matches the property's `hostId` and the property is currently active
- **THEN** the system sets `isActive` to `false` and returns the updated property

#### Scenario: Owner deactivates an already-inactive property
- **WHEN** the authenticated user's id matches the property's `hostId` and the property is already inactive
- **THEN** the system returns the property with `isActive: false` without error

#### Scenario: Non-owner attempts deactivation
- **WHEN** the authenticated user's id does not match the property's `hostId`
- **THEN** the system returns 404 Not Found, identical to the response for a non-existent slug

#### Scenario: Property does not exist
- **WHEN** an authenticated user attempts to deactivate a `slug` that does not exist
- **THEN** the system returns 404 Not Found

#### Scenario: Unauthenticated deactivation attempt
- **WHEN** an unauthenticated request attempts to deactivate a property
- **THEN** the system rejects the request with 401 Unauthorized

#### Scenario: Deactivation emits a domain event
- **WHEN** a property is successfully deactivated
- **THEN** the system emits a `property.deactivated` event containing the property's `slug`
- **AND** the request completes successfully regardless of whether any listener for that event succeeds
