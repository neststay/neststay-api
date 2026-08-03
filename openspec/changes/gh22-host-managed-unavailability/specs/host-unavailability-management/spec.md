## ADDED Requirements

### Requirement: Host creates a manual unavailability block
The system SHALL allow the authenticated host who owns a property to create a `property_unavailability` row for that property with `source: 'host_block'` and `bookingId: null`, for a given check-in/check-out date range.

The created row SHALL be subject to the same exclusion constraint as booking-created rows: a range overlapping any existing `property_unavailability` row for that property (whether `source: 'booking'` or `source: 'host_block'`) SHALL be rejected as a conflict.

#### Scenario: Host blocks an available date range
- **WHEN** the authenticated host who owns the property requests a block for a date range with no overlapping `property_unavailability` row
- **THEN** the system creates a `property_unavailability` row with `source: 'host_block'` and `bookingId: null`, and returns the created block

#### Scenario: Host attempts to block a range that overlaps an existing booking or block
- **WHEN** the authenticated host who owns the property requests a block for a date range that overlaps an existing `property_unavailability` row (booking- or block-sourced)
- **THEN** the system rejects the request with a conflict and does not create a row

### Requirement: Host deletes a manual unavailability block
The system SHALL allow the authenticated host who owns a property to delete a `property_unavailability` row belonging to that property, provided the row's `source` is `'host_block'`.

The system SHALL reject, rather than silently ignore, any attempt to delete a `property_unavailability` row whose `source` is `'booking'`, since removing it would desync a confirmed booking from the property's calendar.

#### Scenario: Host deletes their own block
- **WHEN** the authenticated host who owns the property deletes a `property_unavailability` row on that property with `source: 'host_block'`
- **THEN** the system deletes the row

#### Scenario: Host attempts to delete a booking-sourced row
- **WHEN** the authenticated host who owns the property attempts to delete a `property_unavailability` row on that property with `source: 'booking'`
- **THEN** the system rejects the request with a conflict and does not delete the row

#### Scenario: Host attempts to delete a row belonging to another property
- **WHEN** the authenticated host requests deletion of an unavailability row id that does not belong to the property identified by the given slug
- **THEN** the system responds as if the row does not exist and does not delete anything

### Requirement: Only the owning host may manage a property's unavailability
The system SHALL restrict both creating and deleting `property_unavailability` rows via these endpoints to the authenticated user who is the `host` of the target property.

#### Scenario: Non-owning host attempts to create a block
- **WHEN** an authenticated host who does not own the property requests creation of an unavailability block for it
- **THEN** the system responds as if the property does not exist and does not create a row

#### Scenario: Non-owning host attempts to delete a block
- **WHEN** an authenticated host who does not own the property requests deletion of an unavailability row for it
- **THEN** the system responds as if the property does not exist and does not delete anything
