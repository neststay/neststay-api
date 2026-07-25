## MODIFIED Requirements

### Requirement: Retrieve a single property by slug
The system SHALL allow any caller to retrieve a single property using its public `slug`. The internal `id` SHALL NOT be exposed in the response. The response SHALL include the property's images, embedded via relation and ordered by `order` ascending, so no additional API call is required to obtain them.

#### Scenario: Property exists
- **WHEN** a caller requests a property by a `slug` that exists
- **THEN** the system returns the property's details without an `id` field, including its images ordered by `order`

#### Scenario: Property has no images
- **WHEN** a caller requests a property by a `slug` that has no images
- **THEN** the system returns the property's details with an empty `images` list

#### Scenario: Property does not exist
- **WHEN** a caller requests a property by a `slug` that does not exist
- **THEN** the system returns 404 Not Found

### Requirement: List properties for a location
The system SHALL allow any caller to list properties scoped to a required `locationId`, paginated. Each property in the list SHALL include its images, embedded via relation and ordered by `order` ascending, so no additional API call per property is required.

#### Scenario: Properties exist for the location
- **WHEN** a caller requests the property list with a valid `locationId` and pagination parameters
- **THEN** the system returns a paginated list of properties belonging to that location, each including its images ordered by `order`

#### Scenario: Missing locationId
- **WHEN** a caller requests the property list without a `locationId`
- **THEN** the system rejects the request with 422 Unprocessable Entity

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
