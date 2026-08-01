## ADDED Requirements

### Requirement: Guest creates a booking for a property and date range
The system SHALL allow an authenticated guest to book a property for a check-in/check-out date range, provided no existing `property_unavailability` row for that property overlaps the requested range.

Creating a booking SHALL, in a single transaction, insert a `bookings` row and a corresponding `property_unavailability` row (`source: 'booking'`, linked via `bookingId`), so the property is immediately unavailable for those dates to any subsequent booking or availability check.

The booking SHALL snapshot the property's nightly rate and the computed total amount at creation time, and SHALL record a `paymentStatus` (recorded as `'done'` for this change; real payment processing is out of scope).

The booking SHALL be assigned a short, unique, public-facing reference (`slug`) suitable for use as a guest-facing confirmation code.

#### Scenario: Booking succeeds for available dates
- **WHEN** an authenticated guest requests a booking for a property and date range with no overlapping `property_unavailability` row
- **THEN** the system creates a `bookings` row and a linked `property_unavailability` row, and returns the created booking including its public `slug` reference

#### Scenario: Booking rejected for unavailable dates
- **WHEN** an authenticated guest requests a booking for a property and date range that overlaps an existing `property_unavailability` row
- **THEN** the system rejects the request with a conflict error and creates no `bookings` or `property_unavailability` row

#### Scenario: Concurrent booking requests for overlapping dates
- **WHEN** two requests attempt to book the same property for overlapping date ranges at the same time
- **THEN** exactly one request succeeds and the other is rejected with a conflict error, with no overlapping rows ever persisted in `property_unavailability`

#### Scenario: Booking price reflects the rate at time of booking
- **WHEN** a guest successfully books a property
- **THEN** the created booking stores the property's nightly rate and computed total amount as they were at the time of booking, independent of later changes to the property's nightly rate
