## MODIFIED Requirements

### Requirement: List properties for a location
The system SHALL allow any caller to list properties scoped to a required `locationId`, paginated. Each property in the list SHALL include its images, embedded via relation and ordered by `order` ascending, so no additional API call per property is required. Each property SHALL also include an `isFavourited` boolean computed against the requesting user: `true` if the requesting user has favourited that property, `false` otherwise (including when the caller is unauthenticated). The favourite check MUST be resolved via a batched relation on the same paginated query (no additional query per property).

#### Scenario: Properties exist for the location
- **WHEN** a caller requests the property list with a valid `locationId` and pagination parameters
- **THEN** the system returns a paginated list of properties belonging to that location, each including its images ordered by `order` and an `isFavourited` boolean

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
