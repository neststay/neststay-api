## ADDED Requirements

### Requirement: Add an image to a property
An authenticated user SHALL be able to attach an image to a property they own, addressed by the property's `slug`. The request MUST include a valid `url` and MAY include an `order`; when `order` is omitted it SHALL default to `0`. Ownership SHALL NOT be revealed to non-owners: a non-owner's attempt is indistinguishable from the slug not existing.

#### Scenario: Owner adds an image with an explicit order
- **WHEN** the authenticated user owns the property identified by `slug` and submits a valid `url` and an `order`
- **THEN** the system creates the image with the given `order`, scoped to that property

#### Scenario: Owner adds an image without an order
- **WHEN** the authenticated user owns the property identified by `slug` and submits a valid `url` without an `order`
- **THEN** the system creates the image with `order` set to `0`

#### Scenario: Unauthenticated add attempt
- **WHEN** an unauthenticated request attempts to add an image
- **THEN** the system rejects the request with 401 Unauthorized

#### Scenario: Non-owner attempts to add an image
- **WHEN** the authenticated user does not own the property identified by `slug`
- **THEN** the system returns 404 Not Found, identical to the response for a non-existent slug

#### Scenario: Invalid payload
- **WHEN** an authenticated owner submits a payload with a missing or invalid `url`
- **THEN** the system rejects the request with 422 Unprocessable Entity

### Requirement: List images for a property
The system SHALL allow any caller to list all images belonging to a property, addressed by `slug`, without authentication.

#### Scenario: Property has images
- **WHEN** a caller requests the image list for a `slug` that has images
- **THEN** the system returns all images belonging to that property

#### Scenario: Property has no images
- **WHEN** a caller requests the image list for a `slug` that has no images
- **THEN** the system returns an empty list

#### Scenario: Property does not exist
- **WHEN** a caller requests the image list for a `slug` that does not exist
- **THEN** the system returns 404 Not Found

### Requirement: Delete an image from a property
An authenticated user SHALL be able to delete an image, addressed by `imageId`, only from a property they own, addressed by `slug`. Ownership SHALL NOT be revealed to non-owners. An `imageId` that exists but does not belong to the given property SHALL be treated the same as a non-existent image.

#### Scenario: Owner deletes an image belonging to their property
- **WHEN** the authenticated user owns the property identified by `slug` and the `imageId` belongs to that property
- **THEN** the system deletes the image

#### Scenario: Unauthenticated delete attempt
- **WHEN** an unauthenticated request attempts to delete an image
- **THEN** the system rejects the request with 401 Unauthorized

#### Scenario: Non-owner attempts to delete an image
- **WHEN** the authenticated user does not own the property identified by `slug`
- **THEN** the system returns 404 Not Found, identical to the response for a non-existent slug

#### Scenario: Image belongs to a different property
- **WHEN** the `imageId` exists but belongs to a property other than the one identified by `slug`
- **THEN** the system returns 404 Not Found

#### Scenario: Image does not exist
- **WHEN** the `imageId` does not exist
- **THEN** the system returns 404 Not Found

### Requirement: Reorder a property's images
An authenticated user SHALL be able to set the display order of all images for a property they own, addressed by `slug`, by submitting the complete ordered list of `imageIds`. The system SHALL assign `order` to each image by its zero-based position in the list. Duplicate ids in the submitted list SHALL be tolerated, using the position of the first occurrence and ignoring subsequent repeats. If the submitted list omits any image currently belonging to the property, the system SHALL reject the entire request without applying any change.

#### Scenario: Owner reorders with the full set of image ids
- **WHEN** the authenticated user owns the property identified by `slug` and submits an ordered list containing exactly the property's current image ids
- **THEN** the system updates each image's `order` to match its position in the submitted list

#### Scenario: Owner reorders with duplicate ids in the list
- **WHEN** the submitted list contains the property's full set of current image ids but repeats one or more ids
- **THEN** the system applies the order using each id's first occurrence and ignores later repeats

#### Scenario: Submitted list omits an existing image
- **WHEN** the submitted list does not include one or more of the property's current image ids
- **THEN** the system rejects the request without changing any image's `order`

#### Scenario: Submitted list includes an id not belonging to the property
- **WHEN** the submitted list contains an `imageId` that does not belong to the property identified by `slug`
- **THEN** the system rejects the request without changing any image's `order`

#### Scenario: Unauthenticated reorder attempt
- **WHEN** an unauthenticated request attempts to reorder images
- **THEN** the system rejects the request with 401 Unauthorized

#### Scenario: Non-owner attempts to reorder images
- **WHEN** the authenticated user does not own the property identified by `slug`
- **THEN** the system returns 404 Not Found, identical to the response for a non-existent slug
