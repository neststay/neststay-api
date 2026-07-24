## MODIFIED Requirements

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
