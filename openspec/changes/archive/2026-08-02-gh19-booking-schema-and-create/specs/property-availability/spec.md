## ADDED Requirements

### Requirement: Check property availability for a date range
The system SHALL provide a way to check whether a property is available for a given check-in and check-out date, by querying `property_unavailability` for any overlapping row regardless of whether that row originated from a booking or a host block.

Overlap SHALL treat the check-out date as exclusive: a requested range does not conflict with an existing unavailable range that ends exactly on the requested start date, or starts exactly on the requested end date.

#### Scenario: Property is available for the requested dates
- **WHEN** a client requests availability for a property and date range that has no overlapping row in `property_unavailability`
- **THEN** the system returns that the property is available for those dates

#### Scenario: Property is unavailable for the requested dates
- **WHEN** a client requests availability for a property and date range that overlaps an existing `property_unavailability` row
- **THEN** the system returns that the property is not available for those dates

#### Scenario: Back-to-back ranges do not conflict
- **WHEN** a client requests availability starting on the exact date an existing unavailable range ends
- **THEN** the system returns that the property is available for those dates
